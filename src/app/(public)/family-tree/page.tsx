"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Lock,
  ArrowLeft,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  User,
  Baby,
} from "lucide-react";

type PersonNode = {
  id: string;
  fullname: string;
  callName: string | null;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  occupation: string | null;
  age: number | null;
  isAlive: boolean;
  childrenCount: number;
  parents: string[];
  spouses: { id: string; urutan: number; status: string }[];
  generation: number;
};

type TreeData = {
  familyName: string;
  nodes: PersonNode[];
  edges: { id: string; source: string; target: string; type: string }[];
};

export default function FamilyTreePage() {
  const [data, setData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedAuth = localStorage.getItem("public_auth");
    if (savedAuth) {
      setAuthenticated(true);
      fetchTreeData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTreeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/tree");
      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error("Error fetching tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        fetchTreeData();
      } else {
        setError("Password salah");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("public_auth");
    setAuthenticated(false);
    setData(null);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tree-node")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const formatAge = (age: number | null, isAlive: boolean) => {
    if (age === null) return "";
    if (isAlive) return `${age} tahun`;
    return `Almarhum (${age} th)`;
  };

  const renderNode = (person: PersonNode, index: number) => {
    return (
      <div
        key={person.id}
        className="tree-node absolute cursor-pointer"
        style={{
          left: `${50 + index * 20}%`,
          transform: "translateX(-50%)",
        }}
        onClick={() => setSelectedPerson(person)}
      >
        <div
          className={`
          p-3 rounded-xl min-w-[160px] text-center transition-all hover:scale-105
          ${
            person.gender === "MALE"
              ? "bg-blue-50 border-2 border-blue-200"
              : "bg-pink-50 border-2 border-pink-200"
          }
          ${!person.isAlive ? "opacity-70" : ""}
        `}
        >
          <div
            className={`
            w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2
            ${person.gender === "MALE" ? "bg-blue-500" : "bg-pink-500"}
          `}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-sm text-[#2D3142] truncate">
            {person.fullname}
          </p>
          {person.callName && (
            <p className="text-xs text-[#6B7280] truncate">{person.callName}</p>
          )}
          <div className="mt-1 text-xs text-[#6B7280]">
            {person.age !== null && (
              <p>{formatAge(person.age, person.isAlive)}</p>
            )}
            {person.childrenCount > 0 && (
              <p className="flex items-center justify-center gap-1">
                <Baby className="w-3 h-3" /> {person.childrenCount}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F4F1DE] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#2D3142] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Beranda
          </Link>

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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
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

  const generations = data?.nodes
    ? Array.from(new Set(data.nodes.map((n) => n.generation))).sort(
        (a, b) => a - b,
      )
    : [];

  return (
    <div className="min-h-screen bg-[#F4F1DE]">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E07A5F] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#2D3142]">
              {data?.familyName || "Keluarga"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/statistics" className="btn btn-outline text-sm">
              Statistik
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost text-sm">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="btn bg-white shadow-md text-[#2D3142] hover:bg-gray-50"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          className="btn bg-white shadow-md text-[#2D3142] hover:bg-gray-50"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="btn bg-white shadow-md text-[#2D3142] hover:bg-gray-50"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      <div
        // ref={setContainerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: "calc(100vh - 80px)" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!data || data.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#2D3142] mb-2">
                Belum Ada Data
              </h2>
              <p className="text-[#6B7280] mb-4">
                Silakan masuk ke dashboard untuk menambahkan anggota keluarga
              </p>
              <Link href="/login" className="btn btn-primary">
                Masuk ke Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="relative min-w-max min-h-max p-8"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
            }}
          >
            {generations.map((gen, genIndex) => (
              <div key={gen} className="mb-12">
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-[#E07A5F] text-white text-xs font-medium rounded-full">
                    Generasi {genIndex + 1}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {data.nodes
                    .filter((n) => n.generation === gen)
                    .map((person, idx) => renderNode(person, idx))}
                </div>
                {genIndex < generations.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="w-px h-8 bg-[#E5E7EB]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D3142]">Detail</h2>
              <button
                onClick={() => setSelectedPerson(null)}
                className="p-2 hover:bg-[#F4F1DE] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedPerson.gender === "MALE" ? "bg-blue-500" : "bg-pink-500"}`}
                >
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2D3142]">
                    {selectedPerson.fullname}
                  </p>
                  {selectedPerson.callName && (
                    <p className="text-[#6B7280]">{selectedPerson.callName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Jenis Kelamin</span>
                  <span className="font-medium">
                    {selectedPerson.gender === "MALE"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </span>
                </div>
                {selectedPerson.age !== null && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Usia</span>
                    <span className="font-medium">
                      {formatAge(selectedPerson.age, selectedPerson.isAlive)}
                    </span>
                  </div>
                )}
                {selectedPerson.occupation && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Pekerjaan</span>
                    <span className="font-medium">
                      {selectedPerson.occupation}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Generasi</span>
                  <span className="font-medium">
                    {selectedPerson.generation + 1}
                  </span>
                </div>
                {selectedPerson.childrenCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jumlah Anak</span>
                    <span className="font-medium">
                      {selectedPerson.childrenCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
