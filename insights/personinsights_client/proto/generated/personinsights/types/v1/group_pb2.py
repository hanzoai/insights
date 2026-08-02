"""Generated protocol buffer code."""

from google.protobuf import (
    descriptor as _descriptor,
    descriptor_pool as _descriptor_pool,
    runtime_version as _runtime_version,
    symbol_database as _symbol_database,
)
from google.protobuf.internal import builder as _builder

_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 5, 29, 0, "", "personinsights/types/v1/group.proto"
)
_sym_db = _symbol_database.Default()
from ....personinsights.types.v1 import common_pb2 as personinsights_dot_types_dot_v1_dot_common__pb2

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n#personinsights/types/v1/group.proto\x12\x17personinsights.types.v1\x1a$personinsights/types/v1/common.proto"\xd7\x01\n\x05Group\x12\n\n\x02id\x18\x01 \x01(\x03\x12\x0f\n\x07team_id\x18\x02 \x01(\x03\x12\x18\n\x10group_type_index\x18\x03 \x01(\x05\x12\x11\n\tgroup_key\x18\x04 \x01(\t\x12\x18\n\x10group_properties\x18\x05 \x01(\x0c\x12\x12\n\ncreated_at\x18\x06 \x01(\x03\x12"\n\x1aproperties_last_updated_at\x18\x07 \x01(\x0c\x12!\n\x19properties_last_operation\x18\x08 \x01(\x0c\x12\x0f\n\x07version\x18\t \x01(\x03"\xdd\x02\n\x10GroupTypeMapping\x12\n\n\x02id\x18\x01 \x01(\x03\x12\x0f\n\x07team_id\x18\x02 \x01(\x03\x12\x12\n\nproject_id\x18\x03 \x01(\x03\x12\x12\n\ngroup_type\x18\x04 \x01(\t\x12\x18\n\x10group_type_index\x18\x05 \x01(\x05\x12\x1a\n\rname_singular\x18\x06 \x01(\tH\x00\x88\x01\x01\x12\x18\n\x0bname_plural\x18\x07 \x01(\tH\x01\x88\x01\x01\x12\x1c\n\x0fdefault_columns\x18\x08 \x01(\x0cH\x02\x88\x01\x01\x12 \n\x13detail_dashboard_id\x18\t \x01(\x03H\x03\x88\x01\x01\x12\x17\n\ncreated_at\x18\n \x01(\x03H\x04\x88\x01\x01B\x10\n\x0e_name_singularB\x0e\n\x0c_name_pluralB\x12\n\x10_default_columnsB\x16\n\x14_detail_dashboard_idB\r\n\x0b_created_at"|\n\x0cGroupWithKey\x12.\n\x03key\x18\x01 \x01(\x0b2!.personinsights.types.v1.GroupKey\x122\n\x05group\x18\x02 \x01(\x0b2\x1e.personinsights.types.v1.GroupH\x00\x88\x01\x01B\x08\n\x06_group"b\n\x16GroupTypeMappingsByKey\x12\x0b\n\x03key\x18\x01 \x01(\x03\x12;\n\x08mappings\x18\x02 \x03(\x0b2).personinsights.types.v1.GroupTypeMapping"\xe6\x01\n\x11ListGroupsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05\x12\x1a\n\x12group_key_contains\x18\x03 \x01(\t\x12\x0e\n\x06search\x18\x04 \x01(\t\x12\x1c\n\x14cursor_created_at_ms\x18\x05 \x01(\x03\x12\x11\n\tcursor_id\x18\x06 \x01(\x03\x12\r\n\x05limit\x18\x07 \x01(\x05\x12:\n\x0cread_options\x18\x08 \x01(\x0b2$.personinsights.types.v1.ReadOptions"V\n\x12ListGroupsResponse\x12.\n\x06groups\x18\x01 \x03(\x0b2\x1e.personinsights.types.v1.Group\x12\x10\n\x08has_more\x18\x02 \x01(\x08"\x8b\x01\n\x0fGetGroupRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05\x12\x11\n\tgroup_key\x18\x03 \x01(\t\x12:\n\x0cread_options\x18\x04 \x01(\x0b2$.personinsights.types.v1.ReadOptions"P\n\x10GetGroupResponse\x122\n\x05group\x18\x01 \x01(\x0b2\x1e.personinsights.types.v1.GroupH\x00\x88\x01\x01B\x08\n\x06_group"\xa4\x01\n\x10GetGroupsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12C\n\x11group_identifiers\x18\x02 \x03(\x0b2(.personinsights.types.v1.GroupIdentifier\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"\x82\x01\n\x0eGroupsResponse\x12.\n\x06groups\x18\x01 \x03(\x0b2\x1e.personinsights.types.v1.Group\x12@\n\x0emissing_groups\x18\x02 \x03(\x0b2(.personinsights.types.v1.GroupIdentifier"\x84\x01\n\x15GetGroupsBatchRequest\x12/\n\x04keys\x18\x01 \x03(\x0b2!.personinsights.types.v1.GroupKey\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"P\n\x16GetGroupsBatchResponse\x126\n\x07results\x18\x01 \x03(\x0b2%.personinsights.types.v1.GroupWithKey"r\n#GetGroupTypeMappingsByTeamIdRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"t\n$GetGroupTypeMappingsByTeamIdsRequest\x12\x10\n\x08team_ids\x18\x01 \x03(\x03\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"x\n&GetGroupTypeMappingsByProjectIdRequest\x12\x12\n\nproject_id\x18\x01 \x01(\x03\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"z\n\'GetGroupTypeMappingsByProjectIdsRequest\x12\x13\n\x0bproject_ids\x18\x01 \x03(\x03\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"X\n\x19GroupTypeMappingsResponse\x12;\n\x08mappings\x18\x01 \x03(\x0b2).personinsights.types.v1.GroupTypeMapping"b\n\x1eGroupTypeMappingsBatchResponse\x12@\n\x07results\x18\x01 \x03(\x0b2/.personinsights.types.v1.GroupTypeMappingsByKey"[\n\x1dCountGroupTypeMappingsRequest\x12:\n\x0cread_options\x18\x01 \x01(\x0b2$.personinsights.types.v1.ReadOptions"7\n\x15GroupTypeMappingCount\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\r\n\x05count\x18\x02 \x01(\x03"`\n\x1eCountGroupTypeMappingsResponse\x12>\n\x06counts\x18\x01 \x03(\x0b2..personinsights.types.v1.GroupTypeMappingCount"\x94\x01\n\x12CreateGroupRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05\x12\x11\n\tgroup_key\x18\x03 \x01(\t\x12\x18\n\x10group_properties\x18\x04 \x01(\x0c\x12\x17\n\ncreated_at\x18\x05 \x01(\x03H\x00\x88\x01\x01B\r\n\x0b_created_at"D\n\x13CreateGroupResponse\x12-\n\x05group\x18\x01 \x01(\x0b2\x1e.personinsights.types.v1.Group"\xd1\x02\n\x12UpdateGroupRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05\x12\x11\n\tgroup_key\x18\x03 \x01(\t\x12\x13\n\x0bupdate_mask\x18\x04 \x03(\t\x12\x1d\n\x10group_properties\x18\x05 \x01(\x0cH\x00\x88\x01\x01\x12\'\n\x1aproperties_last_updated_at\x18\x06 \x01(\x0cH\x01\x88\x01\x01\x12&\n\x19properties_last_operation\x18\x07 \x01(\x0cH\x02\x88\x01\x01\x12\x17\n\ncreated_at\x18\x08 \x01(\x03H\x03\x88\x01\x01B\x13\n\x11_group_propertiesB\x1d\n\x1b_properties_last_updated_atB\x1c\n\x1a_properties_last_operationB\r\n\x0b_created_at"U\n\x13UpdateGroupResponse\x12-\n\x05group\x18\x01 \x01(\x0b2\x1e.personinsights.types.v1.Group\x12\x0f\n\x07updated\x18\x02 \x01(\x08"F\n\x1fDeleteGroupsBatchForTeamRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nbatch_size\x18\x02 \x01(\x03"9\n DeleteGroupsBatchForTeamResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03"\xa6\x02\n\x1dUpdateGroupTypeMappingRequest\x12\x12\n\nproject_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05\x12\x13\n\x0bupdate_mask\x18\x03 \x03(\t\x12\x1a\n\rname_singular\x18\x04 \x01(\tH\x00\x88\x01\x01\x12\x18\n\x0bname_plural\x18\x05 \x01(\tH\x01\x88\x01\x01\x12 \n\x13detail_dashboard_id\x18\x06 \x01(\x03H\x02\x88\x01\x01\x12\x1c\n\x0fdefault_columns\x18\x07 \x01(\x0cH\x03\x88\x01\x01B\x10\n\x0e_name_singularB\x0e\n\x0c_name_pluralB\x16\n\x14_detail_dashboard_idB\x12\n\x10_default_columns"\\\n\x1eUpdateGroupTypeMappingResponse\x12:\n\x07mapping\x18\x01 \x01(\x0b2).personinsights.types.v1.GroupTypeMapping"\x8c\x01\n\'GetGroupTypeMappingByDashboardIdRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x14\n\x0cdashboard_id\x18\x02 \x01(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"w\n(GetGroupTypeMappingByDashboardIdResponse\x12?\n\x07mapping\x18\x01 \x01(\x0b2).personinsights.types.v1.GroupTypeMappingH\x00\x88\x01\x01B\n\n\x08_mapping"M\n\x1dDeleteGroupTypeMappingRequest\x12\x12\n\nproject_id\x18\x01 \x01(\x03\x12\x18\n\x10group_type_index\x18\x02 \x01(\x05"1\n\x1eDeleteGroupTypeMappingResponse\x12\x0f\n\x07deleted\x18\x01 \x01(\x08"Q\n*DeleteGroupTypeMappingsBatchForTeamRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nbatch_size\x18\x02 \x01(\x03"D\n+DeleteGroupTypeMappingsBatchForTeamResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03b\x06proto3'
)
_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, "personinsights.types.v1.group_pb2", _globals)
if not _descriptor._USE_C_DESCRIPTORS:
    DESCRIPTOR._loaded_options = None
    _globals["_GROUP"]._serialized_start = 103
    _globals["_GROUP"]._serialized_end = 318
    _globals["_GROUPTYPEMAPPING"]._serialized_start = 321
    _globals["_GROUPTYPEMAPPING"]._serialized_end = 670
    _globals["_GROUPWITHKEY"]._serialized_start = 672
    _globals["_GROUPWITHKEY"]._serialized_end = 796
    _globals["_GROUPTYPEMAPPINGSBYKEY"]._serialized_start = 798
    _globals["_GROUPTYPEMAPPINGSBYKEY"]._serialized_end = 896
    _globals["_LISTGROUPSREQUEST"]._serialized_start = 899
    _globals["_LISTGROUPSREQUEST"]._serialized_end = 1129
    _globals["_LISTGROUPSRESPONSE"]._serialized_start = 1131
    _globals["_LISTGROUPSRESPONSE"]._serialized_end = 1217
    _globals["_GETGROUPREQUEST"]._serialized_start = 1220
    _globals["_GETGROUPREQUEST"]._serialized_end = 1359
    _globals["_GETGROUPRESPONSE"]._serialized_start = 1361
    _globals["_GETGROUPRESPONSE"]._serialized_end = 1441
    _globals["_GETGROUPSREQUEST"]._serialized_start = 1444
    _globals["_GETGROUPSREQUEST"]._serialized_end = 1608
    _globals["_GROUPSRESPONSE"]._serialized_start = 1611
    _globals["_GROUPSRESPONSE"]._serialized_end = 1741
    _globals["_GETGROUPSBATCHREQUEST"]._serialized_start = 1744
    _globals["_GETGROUPSBATCHREQUEST"]._serialized_end = 1876
    _globals["_GETGROUPSBATCHRESPONSE"]._serialized_start = 1878
    _globals["_GETGROUPSBATCHRESPONSE"]._serialized_end = 1958
    _globals["_GETGROUPTYPEMAPPINGSBYTEAMIDREQUEST"]._serialized_start = 1960
    _globals["_GETGROUPTYPEMAPPINGSBYTEAMIDREQUEST"]._serialized_end = 2074
    _globals["_GETGROUPTYPEMAPPINGSBYTEAMIDSREQUEST"]._serialized_start = 2076
    _globals["_GETGROUPTYPEMAPPINGSBYTEAMIDSREQUEST"]._serialized_end = 2192
    _globals["_GETGROUPTYPEMAPPINGSBYPROJECTIDREQUEST"]._serialized_start = 2194
    _globals["_GETGROUPTYPEMAPPINGSBYPROJECTIDREQUEST"]._serialized_end = 2314
    _globals["_GETGROUPTYPEMAPPINGSBYPROJECTIDSREQUEST"]._serialized_start = 2316
    _globals["_GETGROUPTYPEMAPPINGSBYPROJECTIDSREQUEST"]._serialized_end = 2438
    _globals["_GROUPTYPEMAPPINGSRESPONSE"]._serialized_start = 2440
    _globals["_GROUPTYPEMAPPINGSRESPONSE"]._serialized_end = 2528
    _globals["_GROUPTYPEMAPPINGSBATCHRESPONSE"]._serialized_start = 2530
    _globals["_GROUPTYPEMAPPINGSBATCHRESPONSE"]._serialized_end = 2628
    _globals["_COUNTGROUPTYPEMAPPINGSREQUEST"]._serialized_start = 2630
    _globals["_COUNTGROUPTYPEMAPPINGSREQUEST"]._serialized_end = 2721
    _globals["_GROUPTYPEMAPPINGCOUNT"]._serialized_start = 2723
    _globals["_GROUPTYPEMAPPINGCOUNT"]._serialized_end = 2778
    _globals["_COUNTGROUPTYPEMAPPINGSRESPONSE"]._serialized_start = 2780
    _globals["_COUNTGROUPTYPEMAPPINGSRESPONSE"]._serialized_end = 2876
    _globals["_CREATEGROUPREQUEST"]._serialized_start = 2879
    _globals["_CREATEGROUPREQUEST"]._serialized_end = 3027
    _globals["_CREATEGROUPRESPONSE"]._serialized_start = 3029
    _globals["_CREATEGROUPRESPONSE"]._serialized_end = 3097
    _globals["_UPDATEGROUPREQUEST"]._serialized_start = 3100
    _globals["_UPDATEGROUPREQUEST"]._serialized_end = 3437
    _globals["_UPDATEGROUPRESPONSE"]._serialized_start = 3439
    _globals["_UPDATEGROUPRESPONSE"]._serialized_end = 3524
    _globals["_DELETEGROUPSBATCHFORTEAMREQUEST"]._serialized_start = 3526
    _globals["_DELETEGROUPSBATCHFORTEAMREQUEST"]._serialized_end = 3596
    _globals["_DELETEGROUPSBATCHFORTEAMRESPONSE"]._serialized_start = 3598
    _globals["_DELETEGROUPSBATCHFORTEAMRESPONSE"]._serialized_end = 3655
    _globals["_UPDATEGROUPTYPEMAPPINGREQUEST"]._serialized_start = 3658
    _globals["_UPDATEGROUPTYPEMAPPINGREQUEST"]._serialized_end = 3952
    _globals["_UPDATEGROUPTYPEMAPPINGRESPONSE"]._serialized_start = 3954
    _globals["_UPDATEGROUPTYPEMAPPINGRESPONSE"]._serialized_end = 4046
    _globals["_GETGROUPTYPEMAPPINGBYDASHBOARDIDREQUEST"]._serialized_start = 4049
    _globals["_GETGROUPTYPEMAPPINGBYDASHBOARDIDREQUEST"]._serialized_end = 4189
    _globals["_GETGROUPTYPEMAPPINGBYDASHBOARDIDRESPONSE"]._serialized_start = 4191
    _globals["_GETGROUPTYPEMAPPINGBYDASHBOARDIDRESPONSE"]._serialized_end = 4310
    _globals["_DELETEGROUPTYPEMAPPINGREQUEST"]._serialized_start = 4312
    _globals["_DELETEGROUPTYPEMAPPINGREQUEST"]._serialized_end = 4389
    _globals["_DELETEGROUPTYPEMAPPINGRESPONSE"]._serialized_start = 4391
    _globals["_DELETEGROUPTYPEMAPPINGRESPONSE"]._serialized_end = 4440
    _globals["_DELETEGROUPTYPEMAPPINGSBATCHFORTEAMREQUEST"]._serialized_start = 4442
    _globals["_DELETEGROUPTYPEMAPPINGSBATCHFORTEAMREQUEST"]._serialized_end = 4523
    _globals["_DELETEGROUPTYPEMAPPINGSBATCHFORTEAMRESPONSE"]._serialized_start = 4525
    _globals["_DELETEGROUPTYPEMAPPINGSBATCHFORTEAMRESPONSE"]._serialized_end = 4593
