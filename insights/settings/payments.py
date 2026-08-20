from insights.settings.utils import get_from_env

STRIPE_PUBLIC_KEY = get_from_env("STRIPE_PUBLIC_KEY", None, optional=True)

# Read by the organization admin to link out at a billing record. Declared in `ee/settings.py`
# upstream; empty here so the link is absent rather than pointing at someone else's service.
BILLING_SERVICE_URL = get_from_env("BILLING_SERVICE_URL", "")
