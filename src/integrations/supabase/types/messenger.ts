
export type MessengerTables = {
  messenger_settings: {
    Row: {
      access_token: string;
      created_at: string;
      id: number;
      page_id: string;
      updated_at: string;
    };
    Insert: {
      access_token: string;
      created_at?: string;
      id?: number;
      page_id: string;
      updated_at?: string;
    };
    Update: {
      access_token?: string;
      created_at?: string;
      id?: number;
      page_id?: string;
      updated_at?: string;
    };
    Relationships: [];
  };
};
