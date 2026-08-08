import os

from insights.settings.access import SECRET_KEY
from insights.settings.utils import get_from_env, get_list

MESSAGING_HASH_SALT: str = os.getenv("MESSAGING_HASH_SALT") or SECRET_KEY
MESSAGING_HASH_SALT_FALLBACKS: list[str] = [
    salt for salt in get_list(os.getenv("MESSAGING_HASH_SALT_FALLBACKS", "")) if salt
]

# Upstream declared these in `ee/settings.py`, which this fork does not carry; `insights/email.py`
# and `insights/helpers/email_utils.py` kept reading them. The key defaults empty, so
# `is_http_email_service_available()` answers False and email falls to SMTP rather than raising.
CUSTOMER_IO_API_KEY: str = get_from_env("CUSTOMER_IO_API_KEY", "")
CUSTOMER_IO_API_URL: str = get_from_env("CUSTOMER_IO_API_URL", "https://api-eu.customer.io")
