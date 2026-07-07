export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type SyncStatus = "running" | "success" | "partial_failure" | "failed";
