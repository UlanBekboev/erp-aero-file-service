// Интерфейсы для моделей базы данных

export interface IUser {
  id: string;
  password_hash: string;
  created_at?: Date;
}

export interface IFile {
  id: number;
  user_id: string;
  original_name: string;
  storage_name: string;
  extension: string;
  mime_type: string;
  size: number;
  upload_date?: Date;
}

export interface IToken {
  id: number;
  user_id: string;
  device_id: string;
  refresh_token: string;
  jwt_token: string | null;
  is_revoked: boolean;
  created_at?: Date;
  expires_at: Date;
}

// DTO (Data Transfer Objects) - для передачи данных

export interface CreateUserDTO {
  id: string;
  password: string;
}

export interface CreateFileDTO {
  userId: string;
  originalName: string;
  storageName: string;
  extension: string;
  mimeType: string;
  size: number;
}

export interface CreateTokenDTO {
  userId: string;
  deviceId: string;
  refreshToken: string;
  jwtToken: string;
  expiresAt: Date;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
}

export interface PaginatedFiles {
  files: IFile[];
  totalCount: number;
}
