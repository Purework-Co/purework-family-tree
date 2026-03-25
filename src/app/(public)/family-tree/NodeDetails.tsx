"use client";

import { X, Heart, Users, Baby, User, Phone, MessageCircle } from "lucide-react";

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

interface Relation {
  id: string;
  type: string;
}

interface TreeNode {
  id: string;
  gender: "male" | "female";
  parents: Relation[];
  children: Relation[];
  siblings: Relation[];
  spouses: Relation[];
  data: PersonData;
}

interface Props {
  node: TreeNode;
  allNodes: TreeNode[];
  onClose: () => void;
}

function getAge(birth: string | null, death: string | null): string {
  if (!birth) return "Tidak diketahui";
  const birthDate = new Date(birth);
  const endDate = death ? new Date(death) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) age--;
  return `${age} tahun`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RelationList({
  title,
  icon,
  relations,
  nodesMap,
  typeLabel,
}: {
  title: string;
  icon: React.ReactNode;
  relations: Relation[];
  nodesMap: Map<string, TreeNode>;
  typeLabel: (type: string) => string;
}) {
  if (relations.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-[#3D405B]">{title}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {relations.map((r) => {
          const n = nodesMap.get(r.id);
          return (
            <span
              key={r.id}
              className={`text-xs px-2 py-1 rounded-full ${
                n?.gender === "male"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-pink-100 text-pink-700"
              }`}
            >
              {n?.data.fullname || r.id}
              {r.type !== "blood" && r.type !== "married" && (
                <span className="ml-1 opacity-60">({typeLabel(r.type)})</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function toWhatsAppLink(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const withCountry = cleaned.startsWith("0")
    ? "62" + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${withCountry}`;
}

export default function NodeDetails({ node, allNodes, onClose }: Props) {
  const nodesMap = new Map(allNodes.map((n) => [n.id, n]));
  const isDeceased = !!node.data.death;
  const age = getAge(node.data.birth, node.data.death);

  const typeLabel = (t: string) => {
    switch (t) {
      case "blood":
        return "biologis";
      case "adopted":
        return "adopsi";
      case "divorced":
        return "bercerai";
      case "married":
        return "";
      case "half":
        return "saudara tiri";
      default:
        return t;
    }
  };

  return (
    <div className="absolute right-4 top-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      <div
        className={`p-4 ${
          node.gender === "male" ? "bg-blue-50" : "bg-pink-50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-[#2D3142] text-lg">
              {node.data.fullname}
            </h3>
            {node.data.callName && (
              <p className="text-sm text-[#6B7280]">{node.data.callName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={18} className="text-[#6B7280]" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-[#6B7280] text-xs">Jenis Kelamin</span>
            <p className="font-medium text-[#2D3142]">
              {node.gender === "male" ? "Laki-laki" : "Perempuan"}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] text-xs">Status</span>
            <p className="font-medium text-[#2D3142]">
              {isDeceased ? "Almarhum" : "Hidup"}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] text-xs">Usia</span>
            <p className="font-medium text-[#2D3142]">{age}</p>
          </div>
          {node.data.occupation && (
            <div>
              <span className="text-[#6B7280] text-xs">Pekerjaan</span>
              <p className="font-medium text-[#2D3142]">
                {node.data.occupation}
              </p>
            </div>
          )}
          {node.data.hometown && (
            <div>
              <span className="text-[#6B7280] text-xs">Asal</span>
              <p className="font-medium text-[#2D3142]">
                {node.data.hometown}
              </p>
            </div>
          )}
          <div>
            <span className="text-[#6B7280] text-xs">Tanggal Lahir</span>
            <p className="font-medium text-[#2D3142]">
              {formatDate(node.data.birth)}
            </p>
          </div>
          {isDeceased && (
            <div>
              <span className="text-[#6B7280] text-xs">Tanggal Wafat</span>
              <p className="font-medium text-[#2D3142]">
                {formatDate(node.data.death)}
              </p>
            </div>
          )}
        </div>

        {node.data.phone && (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${node.data.phone}`}
              className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#2D3142] transition-colors"
            >
              <Phone size={14} />
              {node.data.phone}
            </a>
            <a
              href={toWhatsAppLink(node.data.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          </div>
        )}

        <hr className="border-gray-100" />

        <RelationList
          title="Orang Tua"
          icon={<User size={14} className="text-[#3D405B]" />}
          relations={node.parents}
          nodesMap={nodesMap}
          typeLabel={typeLabel}
        />
        <RelationList
          title="Pasangan"
          icon={<Heart size={14} className="text-pink-500" />}
          relations={node.spouses}
          nodesMap={nodesMap}
          typeLabel={typeLabel}
        />
        <RelationList
          title="Saudara"
          icon={<Users size={14} className="text-[#3D405B]" />}
          relations={node.siblings}
          nodesMap={nodesMap}
          typeLabel={typeLabel}
        />
        <RelationList
          title={`Anak${node.children.length > 0 ? ` (${node.children.length})` : ""}`}
          icon={<Baby size={14} className="text-[#81B29A]" />}
          relations={node.children}
          nodesMap={nodesMap}
          typeLabel={typeLabel}
        />
      </div>
    </div>
  );
}
