from django import template
from django.template.defaultfilters import stringfilter
import markdown as md

register = template.Library()

@register.filter(name='markdown')
@stringfilter
def markdown_filter(value):
    return md.markdown(value, extensions=['extra'])

@register.filter(name='split')
@stringfilter
def split_filter(value, key=','):
    return [item.strip() for item in value.split(key) if item.strip()]
