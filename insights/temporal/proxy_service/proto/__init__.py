# ruff: noqa: F401 intentionally not using these

# the pb2 files are copied manually from github.com/posthog/proxy-provisioner for now
# this file just manually imports what we import elsewhere
from insights.temporal.proxy_service.proto.proxy_provisioner_pb2 import (
    READY as CertificateState_READY,
    CreateRequest,
    DeleteRequest,
    StatusRequest,
)
from insights.temporal.proxy_service.proto.proxy_provisioner_pb2_grpc import ProxyProvisionerServiceStub
