import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath(".."))

extensions = ["myst_parser"]
language = "en"
project = "Michael Letts"
copyright = f"{date.today().year}, Michael Letts"
author = "Michael Letts"
release = "0.0.1"
source_encoding = "utf-8"
source_suffix = [".rst", ".md"]
pygments_style = "sphinx"
templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store", "tests/"]
html_title = "Michael Letts"
html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]
html_file_suffix = ".html"
html_context = {
    "default_mode": "dark",
}
htmlhelp_basename = "michael-letts"
html_theme_options = {
    "collapse_navigation": True,
    "navbar_end": [
        "navbar-icon-links.html",
    ],
    "navbar_align": "content",
    "show_prev_next": False,
    "secondary_sidebar_items": {
        "path/to/page": [],
    },
    "nosidebar": True,
    "icon_links": [
        {
            "name": "GitHub",
            "url": "https://github.com/michaelthomasletts",
            "icon": "fab fa-github-square",
            "type": "fontawesome",
        },
        {
            "name": "LinkedIn",
            "url": "https://www.linkedin.com/in/lettsmichael/",
            "icon": "fab fa-linkedin",
            "type": "fontawesome",            
        },
        {
            "name": "PyPI",
            "url": "https://pypi.org/user/lettsmt/",
            "icon": "https://img.icons8.com/androidL/512/FFFFFF/pypi.png",
            "type": "url",
        },
    ],    
}
html_sidebars = {
  "**": [],
}