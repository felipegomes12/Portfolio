import re
import urllib.request
import json
from datetime import datetime
from django.utils import timezone
from .models import MyProjects

def parse_github_owner_repo(url_string):
    if not url_string:
        return None, None
    match = re.search(r'github\.com/([^/]+)/([^/#\?]+)', url_string.strip())
    if match:
        owner = match.group(1)
        repo = match.group(2)
        if repo.endswith('.git'):
            repo = repo[:-4]
        return owner, repo
    return None, None

def fetch_github_repo_stats(owner, repo):
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    req = urllib.request.Request(
        api_url,
        headers={
            'User-Agent': 'Portfolio-Django-App',
            'Accept': 'application/vnd.github.v3+json'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching GitHub API for {owner}/{repo}: {e}")
    return None

def sync_github_stats():
    """
    Task to sync GitHub statistics for all projects with a github repo link.
    """
    projects = MyProjects.objects.all()
    updated_count = 0
    errors = []

    for proj in projects:
        link = proj.project_github_rep_link
        if not link:
            continue

        owner, repo = parse_github_owner_repo(link)
        if not owner or not repo:
            continue

        data = fetch_github_repo_stats(owner, repo)
        if data:
            proj.github_repo_name = data.get("name") or repo
            proj.github_stars = data.get("stargazers_count", 0)
            proj.github_forks = data.get("forks_count", 0)
            proj.github_size_kb = data.get("size", 0)
            
            if data.get("description"):
                proj.github_description = data.get("description")
            
            pushed_at_str = data.get("pushed_at") or data.get("updated_at")
            if pushed_at_str:
                try:
                    dt = datetime.strptime(pushed_at_str, "%Y-%m-%dT%H:%M:%SZ")
                    proj.github_updated_at = timezone.make_aware(dt) if timezone.is_naive(dt) else dt
                except Exception as parse_err:
                    print(f"Date parse error: {parse_err}")

            proj.github_last_synced = timezone.now()
            proj.save()
            updated_count += 1
        else:
            errors.append(f"{owner}/{repo}")

    msg = f"Sincronização concluída. {updated_count} projeto(s) atualizado(s)."
    if errors:
        msg += f" (Falha em: {', '.join(errors)})"
    return msg
