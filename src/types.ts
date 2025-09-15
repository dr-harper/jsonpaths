export type JsonData = 
  | null 
  | boolean 
  | number 
  | string 
  | JsonData[] 
  | { [key: string]: JsonData };

export interface TreeNodeProps {
  data: JsonData;
  path: string[];
  onNodeClick: (path: string[]) => void;
  selectedPath: string[];
  level?: number;
}