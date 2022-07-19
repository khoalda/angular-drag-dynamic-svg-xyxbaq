import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Point } from './interfaces/point';
import { NodeLayer } from './interfaces/node';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {
  @ViewChild('svgGrid', { read: ElementRef }) svgGrid: ElementRef<SVGSVGElement>;

  isDraggingGrid = false;
  gridDownClientX: number;
  gridDownClientY: number;
  scaleFactor = 1.02;

  // Node
  isDraggingNodeLayer = false;
  draggingNodeLayer: NodeLayer;
  nodeLayers: NodeLayer[] = [];
  selectedNodeLayers: NodeLayer[] = [];

  @HostListener( 'document:pointerup', [ '$event' ] )
  public upHandle(event: PointerEvent) {
    this.isDraggingGrid = false;
    this.isDraggingNodeLayer = false;
    this.draggingNodeLayer = null;
  }

  @HostListener('document:keyup', ['$event'])
  public handleKeyboardEvent(keyboardEvent: KeyboardEvent) {
    keyboardEvent.preventDefault();
    if (keyboardEvent.keyCode === 8 || keyboardEvent.keyCode === 46) {
      if (this.selectedNodeLayers.length > 0){
        this.nodeLayers = this.nodeLayers.filter(nodeLayer => !nodeLayer.isSelected);
      }
    }
  }

  @HostListener( 'document:pointermove', [ '$event' ] )
  public moveHandle(pointerEvent: PointerEvent){
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();

    if (!this.isDraggingGrid && this.isDraggingNodeLayer) {
      const viewBoxList = this.svgGrid.nativeElement.getAttribute('viewBox').split(' ');
      const aspX = (parseInt(viewBoxList[2], 10) / 500);
      const aspY = (parseInt(viewBoxList[3], 10) / 500);

      // move NodeLayer
      if (pointerEvent.offsetX) {
        this.draggingNodeLayer.positionX = this.round((pointerEvent.offsetX * aspX) + parseInt(viewBoxList[0], 10)) ;
        this.draggingNodeLayer.positionY = this.round((pointerEvent.offsetY * aspY) + parseInt(viewBoxList[1], 10)) ;
      } else {
        const { left, top } = (pointerEvent.srcElement as Element).getBoundingClientRect();
        this.draggingNodeLayer.positionX = pointerEvent.clientX - left + parseInt(viewBoxList[0], 10);
        this.draggingNodeLayer.positionY = pointerEvent.clientY - top + parseInt(viewBoxList[1], 10);
      }


    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Grid: Drag
  downHandleGrid(pointerEvent: PointerEvent) {
    if (!this.isDraggingNodeLayer) {
      this.isDraggingGrid = true;
      pointerEvent.preventDefault();
      this.gridDownClientX = pointerEvent.clientX;
      this.gridDownClientY = pointerEvent.clientY;
    }
  }

  moveHandleGrid(pointerEvent: PointerEvent){
    if (this.isDraggingGrid && !this.isDraggingNodeLayer) {
      pointerEvent.preventDefault();
      const delta: Point = {
        x: pointerEvent.clientX - this.gridDownClientX,
        y: pointerEvent.clientY - this.gridDownClientY
      };
      this.gridDownClientX = pointerEvent.clientX;
      this.gridDownClientY = pointerEvent.clientY;
      this.updateViewBoxMin(delta.x, delta.y);
    }
  }

  updateViewBoxMin(dx: number, dy: number): void {
    const viewBoxList = this.svgGrid.nativeElement.getAttribute('viewBox').split(' ');
    viewBoxList[0] = '' + this.cutoffDragRange(parseInt(viewBoxList[0], 10) - dx);
    viewBoxList[1] = '' + this.cutoffDragRange(parseInt(viewBoxList[1], 10) - dy);
    const viewBox = viewBoxList.join(' ');
    this.svgGrid.nativeElement.setAttribute('viewBox', viewBox);
  }

  cutoffDragRange(draggingPoint: number): number{
    if (draggingPoint < 0) {
      return 0;
    } else if (draggingPoint > 501) {
      return 501;
    }
    return draggingPoint;
  }

  // Grid がクリックされたら選択されている NodeLayers を解除する
  clickHandleGrid(pointerEvent: PointerEvent) {
    pointerEvent.preventDefault();
    if (this.selectedNodeLayers.length > 0){
      this.selectedNodeLayers.forEach((selectedNodeLayer: NodeLayer) => {
        selectedNodeLayer.isSelected = false;
        selectedNodeLayer.shadowFilter = 'url(#shadow)';
      });
      this.selectedNodeLayers = [];
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Grid: Zoom / Pan 
  wheelHandleGrid(wheelEvent: WheelEvent){
    wheelEvent.preventDefault();
    const position = this.getEventPosition(wheelEvent);
    const scale = Math.pow(this.scaleFactor, wheelEvent.deltaY < 0 ? 1 : -1);
    this.zoomAtPoint(position, this.svgGrid.nativeElement, scale);
  }

  getEventPosition(wheel: WheelEvent): Point {
    const point: Point = {x: 0, y: 0};
    if (wheel.offsetX) {
      point.x = wheel.offsetX;
      point.y = wheel.offsetY;
    } else {
      const { left, top } = (wheel.srcElement as Element ).getBoundingClientRect();
      point.x = wheel.clientX - left;
      point.y = wheel.clientY - top;
    }
    return point;
  }

  zoomAtPoint(point: Point, svg: SVGSVGElement, scale: number): void {
    const sx = point.x / svg.clientWidth;
    const sy = point.y / svg.clientHeight;
    const [minX, minY, width, height] = svg.getAttribute('viewBox')
      .split(' ')
      .map(s => parseFloat(s));
    const x = minX + width * sx;
    const y = minY + height * sy;
    const scaledMinX = this.cutoffScaledMin(x + scale * (minX - x));
    const scaledMinY = this.cutoffScaledMin(y + scale * (minY - y));
    const scaledWidth = this.cutoffScaledLength(width * scale);
    const scaledHeight = this.cutoffScaledLength(height * scale);
    const scaledViewBox = [scaledMinX, scaledMinY, scaledWidth, scaledHeight]
      .map(s => s.toFixed(2))
      .join(' ');
    svg.setAttribute('viewBox', scaledViewBox);
  }
  // zoomAtPoint
  cutoffScaledMin(scaledMin: number): number{
    return scaledMin >= 0 ? scaledMin : 0;
  }
  cutoffScaledLength(length: number): number{
    return length <= 750 ? length : 750;
  }

  //////////////////////////////////////////////////////////////////////////////
  // NodeLayer
  downHandleNodeLayer(pointerEvent: PointerEvent, nodeLayer: NodeLayer) {
    this.isDraggingGrid = false;
    this.isDraggingNodeLayer = true;
    this.draggingNodeLayer = nodeLayer;
    pointerEvent.preventDefault();
  }

  clickHandleNodeLayer(pointerEvent: PointerEvent, nodeLayer: NodeLayer) {
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();

    if (!pointerEvent.shiftKey) {
      if (this.selectedNodeLayers.length > 0){
        this.selectedNodeLayers.forEach((selectedSVGLayer: NodeLayer) => {
          selectedSVGLayer.isSelected = false;
          selectedSVGLayer.shadowFilter = 'url(#shadow)';
        });
        this.selectedNodeLayers = [];
      }
    }

    nodeLayer.isSelected = true;
    nodeLayer.shadowFilter = 'url(#liftedShadow)';
    this.selectedNodeLayers.push(nodeLayer);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Button
  addNodeLayer() {
    const randomMin = 250;
    const randomMax = 500;
    const randomColor = ['white'];
    const w = 100;
    const h = 100;
    const pX = this.round(Math.floor( Math.random() * (randomMax + 1 - randomMin) ) + randomMin);
    const pY = this.round(Math.floor( Math.random() * (randomMax + 1 - randomMin) ) + randomMin);

    const newNodeLayer: NodeLayer = {
      id: uuidv4(),
      width: w,
      height: h,
      positionX: pX,
      positionY: pY,
      rotate: 0,
      color: randomColor[ Math.floor( Math.random() * randomColor.length ) ],
      rx: 10,
      ry: 10,
      isSelected: false,
      shadowFilter: 'url(#shadow)'
    }
    this.nodeLayers.push(newNodeLayer);
  }

  round(v) {
    return Math.round(v / 10) * 10;
  }
}
