pub mod personinsights {
    pub mod types {
        pub mod v1 {
            tonic::include_proto!("personinsights.types.v1");
        }
    }
    pub mod identity {
        pub mod v1 {
            tonic::include_proto!("personinsights.identity.v1");
        }
    }
    pub mod leader {
        pub mod v1 {
            tonic::include_proto!("personinsights.leader.v1");
        }
    }
    pub mod replica {
        pub mod v1 {
            tonic::include_proto!("personinsights.replica.v1");
        }
    }
    pub mod service {
        pub mod v1 {
            tonic::include_proto!("personinsights.service.v1");
        }
    }
}
