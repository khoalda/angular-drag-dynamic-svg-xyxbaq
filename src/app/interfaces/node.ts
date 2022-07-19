export interface NodeLayer {
  id: string;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  rotate: number;
  color: string;
  rx: number;
  ry: number;
  isSelected: boolean;
  shadowFilter: string;
}