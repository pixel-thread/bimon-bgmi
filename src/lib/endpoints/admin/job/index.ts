import { EndpointT } from "@/src/types/endpoints";

type JobEndpointsT = "GET_JOB_STATUS";

export const ADMIN_JOB_ENDPOINTS: EndpointT<JobEndpointsT> = {
    GET_JOB_STATUS: "/admin/job/:id",
};
