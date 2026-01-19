/**
 * Global type definitions
 * @module types
 */

/**
 * Video job object
 */
export interface VideoJob {
  id: string | number;
  name?: string;
  filename?: string;
  prompt?: string;
  status?: string;
  rating?: number;
  tags?: string[];
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  previewUrl?: string;
  previewImageUrl?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * File object
 */
export interface File {
  id: string | number;
  original_name?: string;
  filename?: string;
  type?: string;
  size?: number;
  url?: string;
  preview_url?: string;
  created_at?: string;
  updated_at?: string;
  tags?: Tag[];
}

/**
 * Tag object
 */
export interface Tag {
  id: string | number;
  name: string;
  color?: string;
}

/**
 * Story object
 */
export interface Story {
  id: string | number;
  name: string;
  description?: string;
  status?: string;
  progress?: number;
  total_jobs?: number;
  jobs?: VideoJob[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: {
      total?: number;
      current?: number;
      per_page?: number;
    };
  };
  errors?: Array<{
    detail?: string;
    title?: string;
    code?: string;
  }>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  includeTags?: string[];
  excludeTags?: string[];
  rating?: {
    min?: number;
    max?: number;
  };
}

