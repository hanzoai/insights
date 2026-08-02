"""Generated protocol buffer code."""

from google.protobuf import (
    descriptor as _descriptor,
    descriptor_pool as _descriptor_pool,
    runtime_version as _runtime_version,
    symbol_database as _symbol_database,
)
from google.protobuf.internal import builder as _builder

_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 5, 29, 0, "", "personinsights/types/v1/person.proto"
)
_sym_db = _symbol_database.Default()
from ....personinsights.types.v1 import common_pb2 as personinsights_dot_types_dot_v1_dot_common__pb2

DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n$personinsights/types/v1/person.proto\x12\x17personinsights.types.v1\x1a$personinsights/types/v1/common.proto"\x9e\x02\n\x06Person\x12\n\n\x02id\x18\x01 \x01(\x03\x12\x0c\n\x04uuid\x18\x02 \x01(\t\x12\x0f\n\x07team_id\x18\x03 \x01(\x03\x12\x12\n\nproperties\x18\x04 \x01(\x0c\x12"\n\x1aproperties_last_updated_at\x18\x05 \x01(\x0c\x12!\n\x19properties_last_operation\x18\x06 \x01(\x0c\x12\x12\n\ncreated_at\x18\x07 \x01(\x03\x12\x0f\n\x07version\x18\x08 \x01(\x03\x12\x15\n\ris_identified\x18\t \x01(\x08\x12\x17\n\nis_user_id\x18\n \x01(\x08H\x00\x88\x01\x01\x12\x19\n\x0clast_seen_at\x18\x0b \x01(\x03H\x01\x88\x01\x01B\r\n\x0b_is_user_idB\x0f\n\r_last_seen_at"N\n\x15DistinctIdWithVersion\x12\x13\n\x0bdistinct_id\x18\x01 \x01(\t\x12\x14\n\x07version\x18\x02 \x01(\x03H\x00\x88\x01\x01B\n\n\x08_version"m\n\x15PersonWithDistinctIds\x12\x13\n\x0bdistinct_id\x18\x01 \x01(\t\x124\n\x06person\x18\x02 \x01(\x0b2\x1f.personinsights.types.v1.PersonH\x00\x88\x01\x01B\t\n\x07_person"l\n\x11PersonDistinctIds\x12\x11\n\tperson_id\x18\x01 \x01(\x03\x12D\n\x0cdistinct_ids\x18\x02 \x03(\x0b2..personinsights.types.v1.DistinctIdWithVersion"\x91\x01\n\x18PersonWithTeamDistinctId\x124\n\x03key\x18\x01 \x01(\x0b2\'.personinsights.types.v1.TeamDistinctId\x124\n\x06person\x18\x02 \x01(\x0b2\x1f.personinsights.types.v1.PersonH\x00\x88\x01\x01B\t\n\x07_person"r\n\x10GetPersonRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"T\n\x11GetPersonResponse\x124\n\x06person\x18\x01 \x01(\x0b2\x1f.personinsights.types.v1.PersonH\x00\x88\x01\x01B\t\n\x07_person"t\n\x11GetPersonsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nperson_ids\x18\x02 \x03(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"X\n\x0fPersonsResponse\x120\n\x07persons\x18\x01 \x03(\x0b2\x1f.personinsights.types.v1.Person\x12\x13\n\x0bmissing_ids\x18\x02 \x03(\x03"s\n\x16GetPersonByUuidRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x0c\n\x04uuid\x18\x02 \x01(\t\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"v\n\x18GetPersonsByUuidsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\r\n\x05uuids\x18\x02 \x03(\t\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"\x80\x01\n\x1cGetPersonByDistinctIdRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x13\n\x0bdistinct_id\x18\x02 \x01(\t\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"\x89\x01\n$GetPersonsByDistinctIdsInTeamRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x14\n\x0cdistinct_ids\x18\x02 \x03(\t\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions"e\n"PersonsByDistinctIdsInTeamResponse\x12?\n\x07results\x18\x01 \x03(\x0b2..personinsights.types.v1.PersonWithDistinctIds"\xa0\x01\n\x1eGetPersonsByDistinctIdsRequest\x12B\n\x11team_distinct_ids\x18\x01 \x03(\x0b2\'.personinsights.types.v1.TeamDistinctId\x12:\n\x0cread_options\x18\x02 \x01(\x0b2$.personinsights.types.v1.ReadOptions"b\n\x1cPersonsByDistinctIdsResponse\x12B\n\x07results\x18\x01 \x03(\x0b21.personinsights.types.v1.PersonWithTeamDistinctId"\x9e\x01\n\x1eGetDistinctIdsForPersonRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions\x12\x12\n\x05limit\x18\x04 \x01(\x03H\x00\x88\x01\x01B\x08\n\x06_limit"g\n\x1fGetDistinctIdsForPersonResponse\x12D\n\x0cdistinct_ids\x18\x01 \x03(\x0b2..personinsights.types.v1.DistinctIdWithVersion"\xb6\x01\n\x1fGetDistinctIdsForPersonsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nperson_ids\x18\x02 \x03(\x03\x12:\n\x0cread_options\x18\x03 \x01(\x0b2$.personinsights.types.v1.ReadOptions\x12\x1d\n\x10limit_per_person\x18\x04 \x01(\x03H\x00\x88\x01\x01B\x13\n\x11_limit_per_person"k\n GetDistinctIdsForPersonsResponse\x12G\n\x13person_distinct_ids\x18\x01 \x03(\x0b2*.personinsights.types.v1.PersonDistinctIds"\xa6\x01\n\x1dUpdatePersonPropertiesRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03\x12\x12\n\nevent_name\x18\x03 \x01(\t\x12\x16\n\x0eset_properties\x18\x04 \x01(\x0c\x12\x1b\n\x13set_once_properties\x18\x05 \x01(\x0c\x12\x18\n\x10unset_properties\x18\x06 \x03(\t"r\n\x1eUpdatePersonPropertiesResponse\x124\n\x06person\x18\x01 \x01(\x0b2\x1f.personinsights.types.v1.PersonH\x00\x88\x01\x01\x12\x0f\n\x07updated\x18\x02 \x01(\x08B\t\n\x07_person"=\n\x14DeletePersonsRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x14\n\x0cperson_uuids\x18\x02 \x03(\t".\n\x15DeletePersonsResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03"G\n DeletePersonsBatchForTeamRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nbatch_size\x18\x02 \x01(\x03":\n!DeletePersonsBatchForTeamResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03"U\n.DeletePersonlessDistinctIdsBatchForTeamRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x12\n\nbatch_size\x18\x02 \x01(\x03"H\n/DeletePersonlessDistinctIdsBatchForTeamResponse\x12\x15\n\rdeleted_count\x18\x01 \x01(\x03"W\n\x12SplitPersonRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03\x12\x1d\n\x15distinct_ids_to_split\x18\x03 \x03(\t"\x8e\x01\n\x0bSplitResult\x12\x13\n\x0bdistinct_id\x18\x01 \x01(\t\x12\x17\n\x0fnew_person_uuid\x18\x02 \x01(\t\x12\x1a\n\x12new_person_version\x18\x03 \x01(\x03\x12\x13\n\x0bpdi_version\x18\x04 \x01(\x03\x12 \n\x18new_person_created_at_ms\x18\x05 \x01(\x03"K\n\x13SplitPersonResponse\x124\n\x06splits\x18\x01 \x03(\x0b2$.personinsights.types.v1.SplitResult"c\n&SetPersonDistinctIdVersionFloorRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x13\n\x0bdistinct_id\x18\x02 \x01(\t\x12\x13\n\x0bmin_version\x18\x03 \x01(\x03"j\n\'SetPersonDistinctIdVersionFloorResponse\x124\n\x06person\x18\x01 \x01(\x0b2\x1f.personinsights.types.v1.PersonH\x00\x88\x01\x01B\t\n\x07_person"W\n\x1cSetPersonVersionFloorRequest\x12\x0f\n\x07team_id\x18\x01 \x01(\x03\x12\x11\n\tperson_id\x18\x02 \x01(\x03\x12\x13\n\x0bmin_version\x18\x03 \x01(\x03"0\n\x1dSetPersonVersionFloorResponse\x12\x0f\n\x07updated\x18\x01 \x01(\x08b\x06proto3'
)
_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, "personinsights.types.v1.person_pb2", _globals)
if not _descriptor._USE_C_DESCRIPTORS:
    DESCRIPTOR._loaded_options = None
    _globals["_PERSON"]._serialized_start = 104
    _globals["_PERSON"]._serialized_end = 390
    _globals["_DISTINCTIDWITHVERSION"]._serialized_start = 392
    _globals["_DISTINCTIDWITHVERSION"]._serialized_end = 470
    _globals["_PERSONWITHDISTINCTIDS"]._serialized_start = 472
    _globals["_PERSONWITHDISTINCTIDS"]._serialized_end = 581
    _globals["_PERSONDISTINCTIDS"]._serialized_start = 583
    _globals["_PERSONDISTINCTIDS"]._serialized_end = 691
    _globals["_PERSONWITHTEAMDISTINCTID"]._serialized_start = 694
    _globals["_PERSONWITHTEAMDISTINCTID"]._serialized_end = 839
    _globals["_GETPERSONREQUEST"]._serialized_start = 841
    _globals["_GETPERSONREQUEST"]._serialized_end = 955
    _globals["_GETPERSONRESPONSE"]._serialized_start = 957
    _globals["_GETPERSONRESPONSE"]._serialized_end = 1041
    _globals["_GETPERSONSREQUEST"]._serialized_start = 1043
    _globals["_GETPERSONSREQUEST"]._serialized_end = 1159
    _globals["_PERSONSRESPONSE"]._serialized_start = 1161
    _globals["_PERSONSRESPONSE"]._serialized_end = 1249
    _globals["_GETPERSONBYUUIDREQUEST"]._serialized_start = 1251
    _globals["_GETPERSONBYUUIDREQUEST"]._serialized_end = 1366
    _globals["_GETPERSONSBYUUIDSREQUEST"]._serialized_start = 1368
    _globals["_GETPERSONSBYUUIDSREQUEST"]._serialized_end = 1486
    _globals["_GETPERSONBYDISTINCTIDREQUEST"]._serialized_start = 1489
    _globals["_GETPERSONBYDISTINCTIDREQUEST"]._serialized_end = 1617
    _globals["_GETPERSONSBYDISTINCTIDSINTEAMREQUEST"]._serialized_start = 1620
    _globals["_GETPERSONSBYDISTINCTIDSINTEAMREQUEST"]._serialized_end = 1757
    _globals["_PERSONSBYDISTINCTIDSINTEAMRESPONSE"]._serialized_start = 1759
    _globals["_PERSONSBYDISTINCTIDSINTEAMRESPONSE"]._serialized_end = 1860
    _globals["_GETPERSONSBYDISTINCTIDSREQUEST"]._serialized_start = 1863
    _globals["_GETPERSONSBYDISTINCTIDSREQUEST"]._serialized_end = 2023
    _globals["_PERSONSBYDISTINCTIDSRESPONSE"]._serialized_start = 2025
    _globals["_PERSONSBYDISTINCTIDSRESPONSE"]._serialized_end = 2123
    _globals["_GETDISTINCTIDSFORPERSONREQUEST"]._serialized_start = 2126
    _globals["_GETDISTINCTIDSFORPERSONREQUEST"]._serialized_end = 2284
    _globals["_GETDISTINCTIDSFORPERSONRESPONSE"]._serialized_start = 2286
    _globals["_GETDISTINCTIDSFORPERSONRESPONSE"]._serialized_end = 2389
    _globals["_GETDISTINCTIDSFORPERSONSREQUEST"]._serialized_start = 2392
    _globals["_GETDISTINCTIDSFORPERSONSREQUEST"]._serialized_end = 2574
    _globals["_GETDISTINCTIDSFORPERSONSRESPONSE"]._serialized_start = 2576
    _globals["_GETDISTINCTIDSFORPERSONSRESPONSE"]._serialized_end = 2683
    _globals["_UPDATEPERSONPROPERTIESREQUEST"]._serialized_start = 2686
    _globals["_UPDATEPERSONPROPERTIESREQUEST"]._serialized_end = 2852
    _globals["_UPDATEPERSONPROPERTIESRESPONSE"]._serialized_start = 2854
    _globals["_UPDATEPERSONPROPERTIESRESPONSE"]._serialized_end = 2968
    _globals["_DELETEPERSONSREQUEST"]._serialized_start = 2970
    _globals["_DELETEPERSONSREQUEST"]._serialized_end = 3031
    _globals["_DELETEPERSONSRESPONSE"]._serialized_start = 3033
    _globals["_DELETEPERSONSRESPONSE"]._serialized_end = 3079
    _globals["_DELETEPERSONSBATCHFORTEAMREQUEST"]._serialized_start = 3081
    _globals["_DELETEPERSONSBATCHFORTEAMREQUEST"]._serialized_end = 3152
    _globals["_DELETEPERSONSBATCHFORTEAMRESPONSE"]._serialized_start = 3154
    _globals["_DELETEPERSONSBATCHFORTEAMRESPONSE"]._serialized_end = 3212
    _globals["_DELETEPERSONLESSDISTINCTIDSBATCHFORTEAMREQUEST"]._serialized_start = 3214
    _globals["_DELETEPERSONLESSDISTINCTIDSBATCHFORTEAMREQUEST"]._serialized_end = 3299
    _globals["_DELETEPERSONLESSDISTINCTIDSBATCHFORTEAMRESPONSE"]._serialized_start = 3301
    _globals["_DELETEPERSONLESSDISTINCTIDSBATCHFORTEAMRESPONSE"]._serialized_end = 3373
    _globals["_SPLITPERSONREQUEST"]._serialized_start = 3375
    _globals["_SPLITPERSONREQUEST"]._serialized_end = 3462
    _globals["_SPLITRESULT"]._serialized_start = 3465
    _globals["_SPLITRESULT"]._serialized_end = 3607
    _globals["_SPLITPERSONRESPONSE"]._serialized_start = 3609
    _globals["_SPLITPERSONRESPONSE"]._serialized_end = 3684
    _globals["_SETPERSONDISTINCTIDVERSIONFLOORREQUEST"]._serialized_start = 3686
    _globals["_SETPERSONDISTINCTIDVERSIONFLOORREQUEST"]._serialized_end = 3785
    _globals["_SETPERSONDISTINCTIDVERSIONFLOORRESPONSE"]._serialized_start = 3787
    _globals["_SETPERSONDISTINCTIDVERSIONFLOORRESPONSE"]._serialized_end = 3893
    _globals["_SETPERSONVERSIONFLOORREQUEST"]._serialized_start = 3895
    _globals["_SETPERSONVERSIONFLOORREQUEST"]._serialized_end = 3982
    _globals["_SETPERSONVERSIONFLOORRESPONSE"]._serialized_start = 3984
    _globals["_SETPERSONVERSIONFLOORRESPONSE"]._serialized_end = 4032
