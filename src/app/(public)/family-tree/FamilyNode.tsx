"use client";

import { CSSProperties } from "react";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;

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

interface Props {
  id: string;
  gender: "male" | "female";
  top: number;
  left: number;
  hasSubTree: boolean;
  data?: PersonData;
  isRoot?: boolean;
  onClick: (id: string) => void;
  onSubTree: (id: string) => void;
}

function getAge(birth: string | null, death: string | null): string {
  if (!birth) return "";
  const birthDate = new Date(birth);
  const endDate = death ? new Date(death) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) age--;
  return `${age} tahun`;
}

export default function FamilyNode({
  id,
  gender,
  top,
  left,
  hasSubTree,
  data,
  isRoot,
  onClick,
  onSubTree,
}: Props) {
  const style: CSSProperties = {
    position: "absolute",
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    transform: `translate(${left * (NODE_WIDTH / 2)}px, ${top * (NODE_HEIGHT / 2)}px)`,
  };

  const isMale = gender === "male";
  const isDeceased = !!data?.death;
  const age = getAge(data?.birth ?? null, data?.death ?? null);

  return (
    <div data-node-id={id} style={style} className="flex items-center justify-center">
      <div
        onClick={() => onClick(id)}
        className={`relative w-[180px] h-[100px] rounded-xl border-2 shadow-sm cursor-pointer
          transition-all duration-150 hover:shadow-md hover:scale-105
          ${isMale ? "bg-blue-50 border-blue-300" : "bg-pink-50 border-pink-300"}
          ${isRoot ? "ring-2 ring-[#E07A5F] ring-offset-1" : ""}
          ${isDeceased ? "opacity-70" : ""}
        `}
      >
        {hasSubTree && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSubTree(id);
            }}
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs
              flex items-center justify-center z-10 hover:scale-110 transition-transform
              ${isMale ? "bg-blue-500" : "bg-pink-500"}`}
            title="Lihat sub-pohon"
          >
            +
          </button>
        )}

        <div className="flex flex-col items-center justify-center h-full px-2 py-1 text-center">
          <div className="text-xs font-bold text-[#2D3142] truncate max-w-[170px]">
            {data?.fullname || id}
          </div>
          {data?.callName && (
            <div className="text-[10px] text-[#6B7280] truncate max-w-[170px]">
              {data.callName}
            </div>
          )}
          {age && (
            <div className="text-[10px] text-[#6B7280]">
              {isDeceased ? `Almarhum (${age})` : age}
            </div>
          )}
          {data?.hometown && (
            <div className="text-[10px] text-[#81B29A] truncate max-w-[170px]">
              {data.hometown}
            </div>
          )}
          {data?.phone && (
            <div className="text-[10px] text-[#6B7280] truncate max-w-[170px]">
              {data.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { NODE_WIDTH, NODE_HEIGHT };
