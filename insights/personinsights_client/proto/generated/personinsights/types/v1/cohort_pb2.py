"""Generated protocol buffer code."""

from google.protobuf import (
    descriptor as _descriptor,
    descriptor_pool as _descriptor_pool,
    runtime_version as _runtime_version,
    symbol_database as _symbol_database,
)
from google.protobuf.internal import builder as _builder

_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 5, 29, 0, "", "personinsights/types/v1/cohort.proto"
)
_sym_db = _symbol_database.Default()
from ....personinsights.types.v1 import common_pb2 as personinsights_dot_types_dot_v1_dot_common__pb2

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n$personinsights/types/v1/cohort.proto\x12\x17personinsights.types.v1\x1a$personinsights/types/v1/common.proto"8\n\x10CohortMembership\x12\x11\n\tcohort_id\x18\x01 \x01(\x03\x12\x11\n\tis_member\x18\x02 \x01(\x08"\x81\x01\n\x1cCheckCohortMembershipRequest\x12\x11\n\tperson_id\x18\x01 \x01(\x03\x12\x12\n\ncohort_ids\x18\x02 \x03(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"Z\n\x18CohortMembershipResponse\x12>\n\x0bmemberships\x18\x01 \x03(\x0b2).personinsights.types.v1.CohortMembership"k\n\x19CountCohortMembersRequest\x12\x12\n\ncohort_ids\x18\x01 \x03(\x03\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"+\n\x1aCountCohortMembersResponse\x12\r\n\x05count\x18\x01 \x01(\x03"A\n\x19DeleteCohortMemberRequest\x12\x11\n\tcohort_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03"-\n\x1aDeleteCohortMemberResponse\x12\x0f\n\x07deleted\x18\x01 \x01(\x08"H\n\x1eDeleteCohortMembersBulkRequest\x12\x12\n\ncohort_ids\x18\x01 \x03(\x03\x12\x12\n\nbatch_size\x18\x02 \x01(\x05"8\n\x1fDeleteCohortMembersBulkResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03"e\n\x1aInsertCohortMembersRequest\x12\x11\n\tcohort_id\x18\x01 \x01(\x03\x12\x12\n\nperson_ids\x18\x02 \x03(\x03\x12\x14\n\x07version\x18\x03 \x01(\x05H\x00\x88\x01\x01B\n\n\x08_version"5\n\x1bInsertCohortMembersResponse\x12\x16\n\x0einserted_count\x18\x01 \x01(\x03"\x8a\x01\n\x1aListCohortMemberIdsRequest\x12\x11\n\tcohort_id\x18\x01 \x01(\x03\x12\x0e\n\x06cursor\x18\x02 \x01(\x03\x12\r\n\x05limit\x18\x03 \x01(\x05\x12:\n\x0cread_options\x18\x04 \x01(\x0b2$.personinsights.types.v1.ReadOptions"F\n\x1bListCohortMemberIdsResponse\x12\x12\n\nperson_ids\x18\x01 \x03(\x03\x12\x13\n\x0bnext_cursor\x18\x02 \x01(\x03b\x06proto3'
)
_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, "personinsights.types.v1.cohort_pb2", _globals)
if not _descriptor._USE_C_DESCRIPTORS:
    DESCRIPTOR._loaded_options = None
    _globals["_COHORTMEMBERSHIP"]._serialized_start = 103
    _globals["_COHORTMEMBERSHIP"]._serialized_end = 159
    _globals["_CHECKCOHORTMEMBERSHIPREQUEST"]._serialized_start = 162
    _globals["_CHECKCOHORTMEMBERSHIPREQUEST"]._serialized_end = 291
    _globals["_COHORTMEMBERSHIPRESPONSE"]._serialized_start = 293
    _globals["_COHORTMEMBERSHIPRESPONSE"]._serialized_end = 383
    _globals["_COUNTCOHORTMEMBERSREQUEST"]._serialized_start = 385
    _globals["_COUNTCOHORTMEMBERSREQUEST"]._serialized_end = 492
    _globals["_COUNTCOHORTMEMBERSRESPONSE"]._serialized_start = 494
    _globals["_COUNTCOHORTMEMBERSRESPONSE"]._serialized_end = 537
    _globals["_DELETECOHORTMEMBERREQUEST"]._serialized_start = 539
    _globals["_DELETECOHORTMEMBERREQUEST"]._serialized_end = 604
    _globals["_DELETECOHORTMEMBERRESPONSE"]._serialized_start = 606
    _globals["_DELETECOHORTMEMBERRESPONSE"]._serialized_end = 651
    _globals["_DELETECOHORTMEMBERSBULKREQUEST"]._serialized_start = 653
    _globals["_DELETECOHORTMEMBERSBULKREQUEST"]._serialized_end = 725
    _globals["_DELETECOHORTMEMBERSBULKRESPONSE"]._serialized_start = 727
    _globals["_DELETECOHORTMEMBERSBULKRESPONSE"]._serialized_end = 783
    _globals["_INSERTCOHORTMEMBERSREQUEST"]._serialized_start = 785
    _globals["_INSERTCOHORTMEMBERSREQUEST"]._serialized_end = 886
    _globals["_INSERTCOHORTMEMBERSRESPONSE"]._serialized_start = 888
    _globals["_INSERTCOHORTMEMBERSRESPONSE"]._serialized_end = 941
    _globals["_LISTCOHORTMEMBERIDSREQUEST"]._serialized_start = 944
    _globals["_LISTCOHORTMEMBERIDSREQUEST"]._serialized_end = 1082
    _globals["_LISTCOHORTMEMBERIDSRESPONSE"]._serialized_start = 1084
    _globals["_LISTCOHORTMEMBERIDSRESPONSE"]._serialized_end = 1154
