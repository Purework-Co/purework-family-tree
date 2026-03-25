"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ReactFamilyTree from "react-family-tree";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import { Users, ZoomIn, ZoomOut, Maximize, BarChart3, Lock, LogOut } from "lucide-react";
import FamilyNode, { NODE_WIDTH, NODE_HEIGHT } from "./FamilyNode";
import NodeDetails from "./NodeDetails";

interface PersonData {
  fullname: string;
  callName: string | null;
  gender: "male" | "female";
  occupation: string | null;
  hometown: string | null;
  phone: string | null;
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
  updatedAt: string | null;
  nodes: TreeNode[];
}

const SCALE_STEP = 0.15;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function FamilyTreePage() {
  const [data, setData] = useState<TreeData | null>(null);
  const [rootId, setRootId] = useState<string>("");
  const [selectId, setSelectId] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem("public_auth");
    if (savedAuth) {
      setAuthenticated(true);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
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
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setChecking(true);
    try {
      const res = await fetch("/api/public/validate-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();
      if (result.valid) {
        setAuthenticated(true);
        localStorage.setItem("public_auth", "true");
      } else {
        setAuthError("Password salah");
      }
    } catch {
      setAuthError("Terjadi kesalahan");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("public_auth");
    setAuthenticated(false);
    setData(null);
  };

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F4F1DE]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="w-16 h-16 bg-[#E07A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#2D3142] mb-2">
              Pohon Keluarga
            </h1>
            <p className="text-[#6B7280] mb-6">
              Masukkan password publik untuk melihat pohon keluarga
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {authError}
                </div>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Masukkan password"
                required
              />
              <button
                type="submit"
                disabled={checking}
                className="btn btn-primary w-full"
              >
                {checking ? "Memuat..." : "Lihat Pohon Keluarga"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-full px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[#E07A5F]" size={22} />
            <div>
              <h1 className="font-bold text-lg text-[#2D3142]">
                {data.familyName}
              </h1>
              {data.updatedAt && (
                <p className="text-[10px] text-[#9CA3AF]">
                  Diperbarui: {formatDate(data.updatedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/statistics"
              className="flex items-center gap-1.5 text-sm text-[#81B29A] hover:text-[#6B9F85] border border-[#81B29A] hover:bg-[#81B29A]/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              <BarChart3 size={16} />
              Statistik
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>

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
