"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import ReactFamilyTree from "react-family-tree";
import type { ExtNode, Node } from "relatives-tree/lib/types";
import { Users, ZoomIn, ZoomOut, Maximize, BarChart3, Lock, LogOut, Download, AlertTriangle, MoreHorizontal } from "lucide-react";
import FamilyNode, { NODE_WIDTH, NODE_HEIGHT } from "./FamilyNode";
import NodeDetails from "./NodeDetails";
import SearchableSelect from "@/components/SearchableSelect";

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
  totalNodes: number;
  nodes: TreeNode[];
}

const SCALE_STEP = 0.15;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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
  const [downloading, setDownloading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem("public_auth");
    if (savedAuth) setAuthenticated(true);
    setAuthLoading(false);
  }, []);

  const fetchData = useCallback(async (selectedRootId?: string) => {
    const params = new URLSearchParams();
    if (selectedRootId) params.set("rootId", selectedRootId);
    const qs = params.toString();
    const res = await fetch(`/api/public/tree${qs ? `?${qs}` : ""}`);
    const d: TreeData = await res.json();
    setData(d);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
  }, [authenticated, fetchData]);

  const handleSubTree = async (id: string) => {
    setRootId(id);
    setSelectId("");
    setOffset({ x: 0, y: 0 });
    setScale(1);
    await fetchData(id);
  };

  const handleSearchSelect = (id: string) => {
    if (!data || !treeRef.current) return;
    setSelectId(id);

    // Check if node exists in current tree
    const nodeExists = data.nodes.some(n => n.id === id);
    if (!nodeExists) {
      // Fall back to subtree mode if not in tree
      handleSubTree(id);
      return;
    }

    // Use requestAnimationFrame to wait for DOM render
    requestAnimationFrame(() => {
      // Find the selected node's position via DOM
      const nodeEl = treeRef.current?.querySelector(`[data-node-id="${id}"]`);
      if (!nodeEl) return;

      const containerRect = treeRef.current!.getBoundingClientRect();
      const nodeRect = nodeEl.getBoundingClientRect();

      // Node center in viewport coordinates
      const nodeCenterX = nodeRect.left + nodeRect.width / 2 - containerRect.left;
      const nodeCenterY = nodeRect.top + nodeRect.height / 2 - containerRect.top;

      // Container center
      const viewCenterX = containerRect.width / 2;
      const viewCenterY = containerRect.height / 2;

      // Adjust offset to center the node
      const targetScale = Math.min(1.5, MAX_SCALE);
      const offsetX = viewCenterX - nodeCenterX + offset.x;
      const offsetY = viewCenterY - nodeCenterY + offset.y;

      setOffset({ x: offsetX, y: offsetY });
      setScale(targetScale);
    });
  };

  const handleResetRoot = async () => {
    setRootId("");
    setSelectId("");
    setOffset({ x: 0, y: 0 });
    setScale(1);
    await fetchData();
  };

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

  const handleDownloadPDF = async () => {
    if (!treeRef.current || !data) return;
    setDownloading(true);
    setShowMobileMenu(false);
    try {
      const { toPng } = await import("html-to-image");
      const { default: jsPDF } = await import("jspdf");
      const dataUrl = await toPng(treeRef.current, { cacheBust: true, backgroundColor: "#F4F1DE", pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.setFontSize(14);
      pdf.setTextColor(45, 49, 66);
      pdf.text(`${data.familyName} - Pohon Keluarga`, 14, 14);
      pdf.addImage(dataUrl, "PNG", 0, 20, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20));
      pdf.save(`${data.familyName.toLowerCase().replace(/\s+/g, "-")}-pohon-keluarga.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const nodesMap = useMemo(
    () => (data ? new Map(data.nodes.map((n) => [n.id, n])) : new Map()),
    [data],
  );
  const selectedNode = selectId ? nodesMap.get(selectId) : null;
  const personOptions = useMemo(
    () => data ? data.nodes.map((n) => ({ id: n.id, label: `${n.data.fullname}${n.data.callName ? ` (${n.data.callName})` : ""}` })) : [],
    [data],
  );

  const handleZoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const handleZoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  const handleFit = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  // Mouse drag
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

  // Touch drag
  const touchRef = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, startOffsetX: offset.x, startOffsetY: offset.y };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    setOffset({
      x: touchRef.current.startOffsetX + (t.clientX - touchRef.current.startX),
      y: touchRef.current.startOffsetY + (t.clientY - touchRef.current.startY),
    });
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
            <h1 className="text-2xl font-bold text-[#2D3142] mb-2">Pohon Keluarga</h1>
            <p className="text-[#6B7280] mb-6">Masukkan password publik untuk melihat pohon keluarga</p>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{authError}</div>}
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Masukkan password" required />
              <button type="submit" disabled={checking} className="btn btn-primary w-full">{checking ? "Memuat..." : "Lihat Pohon Keluarga"}</button>
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

  const showLargeWarning = data.totalNodes > 500 && !rootId;

  return (
    <div className="h-screen flex flex-col bg-[#F4F1DE]">
      {/* Header - Row 1: title + search + mobile menu */}
      <header className="bg-white shadow-sm flex-shrink-0 z-20 relative">
        <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="text-[#E07A5F] flex-shrink-0" size={20} />
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-lg text-[#2D3142] truncate">{data.familyName}</h1>
              {data.updatedAt && (
                <p className="text-[9px] sm:text-[10px] text-[#9CA3AF] hidden sm:block">Diperbarui: {formatDate(data.updatedAt)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <SearchableSelect
              value={selectId}
              onChange={handleSearchSelect}
              options={personOptions}
              placeholder="Cari..."
              className="w-32 sm:w-56"
            />

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {rootId && (
                <button onClick={handleResetRoot} className="text-xs text-[#E07A5F] hover:underline whitespace-nowrap">Tampilkan Semua</button>
              )}
              <Link href="/statistics" className="flex items-center gap-1.5 text-sm text-[#81B29A] border border-[#81B29A] hover:bg-[#81B29A]/10 rounded-lg px-3 py-1.5 transition-colors">
                <BarChart3 size={16} /><span>Statistik</span>
              </Link>
              <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-1.5 text-sm text-[#E07A5F] border border-[#E07A5F] hover:bg-[#E07A5F]/10 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                <Download size={16} /><span>{downloading ? "..." : "PDF"}</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors">
                <LogOut size={16} /><span>Keluar</span>
              </button>
              <div className="flex items-center gap-1 ml-1 border-l pl-2">
                <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Zoom Out"><ZoomOut size={16} className="text-[#6B7280]" /></button>
                <span className="text-xs text-[#6B7280] w-8 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Zoom In"><ZoomIn size={16} className="text-[#6B7280]" /></button>
                <button onClick={handleFit} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Reset"><Maximize size={16} className="text-[#6B7280]" /></button>
              </div>
            </div>

            {/* Mobile: "Tampilkan Semua" link + more menu */}
            {rootId && (
              <button onClick={handleResetRoot} className="sm:hidden text-[10px] text-[#E07A5F] hover:underline whitespace-nowrap">Semua</button>
            )}
            <div className="relative sm:hidden">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreHorizontal size={18} className="text-[#6B7280]" />
              </button>
              {showMobileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <Link href="/statistics" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-[#3D405B] hover:bg-[#F4F1DE]">
                      <BarChart3 size={16} /> Statistik
                    </Link>
                    <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-2 px-4 py-3 text-sm text-[#3D405B] hover:bg-[#F4F1DE] w-full text-left">
                      <Download size={16} /> {downloading ? "Membuat PDF..." : "Unduh PDF"}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLargeWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-6 py-2 flex flex-wrap items-center gap-2 flex-shrink-0">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-amber-700">{data.totalNodes} anggota. Gunakan pencarian untuk sub-pohon.</span>
          <button onClick={handleResetRoot} className="text-xs sm:text-sm text-amber-800 font-medium hover:underline">Tampilkan semua</button>
        </div>
      )}

      {/* Tree canvas */}
      <div
        ref={treeRef}
        className="flex-1 relative overflow-hidden select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
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
            rootId={rootId || data.nodes[0]?.id}
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
