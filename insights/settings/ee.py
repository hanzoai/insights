# This fork carries no enterprise edition: the ee/ tree is not distributed with it, so the
# enterprise code paths can never become available. Kept as a constant rather than dropped
# entirely because upstream guards a lot of optional behavior behind it, and a False seam lets
# those guards keep compiling untouched across rebases.
EE_AVAILABLE = False
