from .models import AccessLog


class AccessLogMiddleware:
    """
    Logs page visits from non-authenticated users on public routes.
    Admin sessions are excluded to avoid skewing statistics.
    """

    PUBLIC_PREFIXES = ("/", "/projects/")
    EXCLUDED_PREFIXES = ("/panel/", "/api/", "/static/", "/media/", "/i18n/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log successful GET requests from non-authenticated users
        if request.method != "GET":
            return response

        if hasattr(request, "user") and request.user.is_authenticated:
            return response

        path = request.path

        # Skip admin, API, static, and media routes
        if any(path.startswith(prefix) for prefix in self.EXCLUDED_PREFIXES):
            return response

        # Only log public pages (home and project detail)
        is_public = path == "/" or path.startswith("/projects/")
        if not is_public:
            return response

        # Only log successful responses
        if response.status_code != 200:
            return response

        # Extract IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "unknown")

        user_agent = request.META.get("HTTP_USER_AGENT", "")

        try:
            AccessLog.objects.create(
                ip_address=ip,
                user_agent=user_agent,
                page_path=path,
            )
        except Exception:
            pass  # Never break the request for telemetry

        return response
