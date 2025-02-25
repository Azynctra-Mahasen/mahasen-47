
export type KnowledgeBaseTables = {
  knowledge_base_files: {
    Row: {
      content: string | null;
      content_type: string;
      created_at: string;
      embedding: string | null;
      file_path: string;
      filename: string;
      fts: unknown | null;
      id: string;
      size: number;
      user_id: string;
    };
    Insert: {
      content?: string | null;
      content_type: string;
      created_at?: string;
      embedding?: string | null;
      file_path: string;
      filename: string;
      fts?: unknown | null;
      id?: string;
      size: number;
      user_id: string;
    };
    Update: {
      content?: string | null;
      content_type?: string;
      created_at?: string;
      embedding?: string | null;
      file_path?: string;
      filename?: string;
      fts?: unknown | null;
      id?: string;
      size?: number;
      user_id?: string;
    };
    Relationships: [];
  };
};
