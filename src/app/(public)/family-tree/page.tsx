"use client";

import { useEffect, useState, useMemo } from "react";
import ReactFamilyTree from "react-family-tree";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import { Users, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import FamilyNode, { NODE_WIDTH, NODE_HEIGHT } from "./FamilyNode";
import NodeDetails from "./NodeDetails";

interface PersonData {
  fullname: string;
  callName: string | null;
  gender: "male" | "female";
  occupation: string | null;
  birth: string | null;
  death: string | null;
}

interface RelationItem {
  id: string;
  type: "blood" | "married" | "divorced" | "adopted" | "half";
}

interface TreeNode {
  id: string;
  gender: "male" | "female";
  parents: RelationItem[];
  children: RelationItem[];
  siblings: RelationItem[];
  spouses: RelationItem[];
  data: PersonData;
}

interface TreeData {
  familyName: string;
  nodes: TreeNode[];
}

const SCALE_STEP = 0.15;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export default function FamilyTreePage() {
  const [data, setData] = useState<TreeData | null>(null);
  const [rootId, setRootId] = useState<string>("");
  const [selectId, setSelectId] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/public/tree")
      .then((r) => r.json())
      .then((d: TreeData) => {
        setData(d);
        if (d.nodes.length > 0) {
          const hasParents = new Set<string>();
          for (const n of d.nodes) {
            if (n.parents.length > 0) hasParents.add(n.id);
          }
          const roots = d.nodes.filter((n) => !hasParents.has(n.id));
          setRootId(roots.length > 0 ? roots[0].id : d.nodes[0].id);
        }
      });
  }, []);

  const nodesMap = useMemo(
    () => (data ? new Map(data.nodes.map((n) => [n.id, n])) : new Map()),
    [data],
  );

  const selectedNode = selectId ? nodesMap.get(selectId) : null;

  const handleSubTree = (id: string) => {
    setRootId(id);
    setSelectId("");
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const handleResetRoot = () => {
    if (!data) return;
    const hasParents = new Set<string>();
    for (const n of data.nodes) {
      if (n.parents.length > 0) hasParents.add(n.id);
    }
    const roots = data.nodes.filter((n) => !hasParents.has(n.id));
    setRootId(roots.length > 0 ? roots[0].id : data.nodes[0].id);
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const handleZoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const handleZoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  const handleFit = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s + delta)));
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F1DE]">
        <div className="text-[#6B7280]">Memuat pohon keluarga...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F4F1DE]">
      <header className="bg-white shadow-sm flex-shrink-0 z-20 relative">
        <div className="max-w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[#E07A5F]" size={22} />
            <h1 className="font-bold text-lg text-[#2D3142]">
              {data.familyName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={rootId}
              onChange={(e) => handleSubTree(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white
                focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
            >
              {data.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.fullname}
                </option>
              ))}
            </select>

            {rootId && (
              <button
                onClick={handleResetRoot}
                className="text-xs text-[#E07A5F] hover:underline"
              >
                Tampilkan Semua
              </button>
            )}

            <div className="flex items-center gap-1 ml-3 border-l pl-3">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={18} className="text-[#6B7280]" />
              </button>
              <span className="text-xs text-[#6B7280] w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={18} className="text-[#6B7280]" />
              </button>
              <button
                onClick={handleFit}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset"
              >
                <Maximize size={18} className="text-[#6B7280]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className="flex-1 relative overflow-hidden cursor-grab select-none"
        style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            position: "absolute",
            transformOrigin: "0 0",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <ReactFamilyTree
            nodes={data.nodes as unknown as readonly Node[]}
            rootId={rootId}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            renderNode={(node: ExtNode) => (
              <FamilyNode
                key={node.id}
                id={node.id}
                gender={node.gender}
                top={node.top}
                left={node.left}
                hasSubTree={node.hasSubTree}
                data={nodesMap.get(node.id)?.data}
                isRoot={node.id === rootId}
                onClick={setSelectId}
                onSubTree={handleSubTree}
              />
            )}
          />
        </div>

        {selectedNode && (
          <NodeDetails
            node={selectedNode}
            allNodes={data.nodes}
            onClose={() => setSelectId("")}
          />
        )}
      </div>
    </div>
  );
}
