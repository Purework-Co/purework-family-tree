import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RelationItem = {
  id: string;
  type: "blood" | "married" | "divorced" | "adopted" | "half";
};

type PersonData = {
  fullname: string;
  callName: string | null;
  gender: "male" | "female";
  occupation: string | null;
  hometown: string | null;
  phone: string | null;
  birth: string | null;
  death: string | null;
};

type TreeNode = {
  id: string;
  gender: "male" | "female";
  parents: RelationItem[];
  children: RelationItem[];
  siblings: RelationItem[];
  spouses: RelationItem[];
  data: PersonData;
};

function mapRelType(
  subType: string | null,
): "blood" | "married" | "divorced" | "adopted" {
  switch (subType) {
    case "ADOPTED":
      return "adopted";
    case "DIVORCED":
      return "divorced";
    default:
      return "blood";
  }
}

const MAX_SUBTREE_NODES = 200;

function bfsFromRoot(
  rootId: string,
  nodes: Map<string, TreeNode>,
): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [rootId];

  while (queue.length > 0 && visited.size < MAX_SUBTREE_NODES) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.get(id);
    if (!node) continue;

    for (const r of node.parents) if (!visited.has(r.id)) queue.push(r.id);
    for (const r of node.children) if (!visited.has(r.id)) queue.push(r.id);
    for (const r of node.spouses) if (!visited.has(r.id)) queue.push(r.id);
    for (const r of node.siblings) if (!visited.has(r.id)) queue.push(r.id);
  }

  return visited;
}

function filterRelationsByNodes(
  reachableIds: Set<string>,
  nodes: Map<string, TreeNode>,
): Map<string, TreeNode> {
  const filtered = new Map<string, TreeNode>();

  for (const id of Array.from(reachableIds)) {
    const node = nodes.get(id);
    if (!node) continue;
    filtered.set(id, {
      ...node,
      parents: node.parents.filter((r) => reachableIds.has(r.id)),
      children: node.children.filter((r) => reachableIds.has(r.id)),
      spouses: node.spouses.filter((r) => reachableIds.has(r.id)),
      siblings: node.siblings.filter((r) => reachableIds.has(r.id)),
    });
  }

  return filtered;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootId = searchParams.get("rootId") || "";

    const [people, relations, settings] = await Promise.all([
      prisma.person.findMany(),
      prisma.personRelation.findMany(),
      prisma.settings.findUnique({ where: { id: "default" } }),
    ]);

    const totalNodes = people.length;

    const personMap = new Map<string, PersonData>();
    for (const p of people) {
      personMap.set(p.id, {
        fullname: p.fullname,
        callName: p.callName,
        gender: p.gender === "MALE" ? "male" : "female",
        occupation: p.occupation,
        hometown: p.hometown,
        phone: p.phone,
        birth: p.dateOfBirth?.toISOString() || null,
        death: p.dateOfDeath?.toISOString() || null,
      });
    }

    const nodes = new Map<string, TreeNode>();
    for (const p of people) {
      const data = personMap.get(p.id)!;
      nodes.set(p.id, {
        id: p.id,
        gender: data.gender,
        parents: [],
        children: [],
        siblings: [],
        spouses: [],
        data,
      });
    }

    for (const r of relations) {
      const fromNode = nodes.get(r.fromPersonId);
      const toNode = nodes.get(r.toPersonId);
      if (!fromNode || !toNode) continue;

      if (r.relationType === "ORANGTUA_ANAK") {
        const relType = mapRelType(r.relationSubType);
        fromNode.parents.push({ id: r.toPersonId, type: relType });
        toNode.children.push({ id: r.fromPersonId, type: relType });
      }

      if (r.relationType === "PASANGAN") {
        const relType =
          r.relationSubType === "DIVORCED" ? "divorced" : "married";
        fromNode.spouses.push({ id: r.toPersonId, type: relType });
        toNode.spouses.push({ id: r.fromPersonId, type: relType });
      }
    }

    const childrenByParent = new Map<string, Set<string>>();
    for (const r of relations) {
      if (r.relationType === "ORANGTUA_ANAK") {
        if (!childrenByParent.has(r.toPersonId))
          childrenByParent.set(r.toPersonId, new Set());
        childrenByParent.get(r.toPersonId)!.add(r.fromPersonId);
      }
    }

    const parentPairs = new Map<string, Set<string>>();
    for (const r of relations) {
      if (r.relationType === "PASANGAN") {
        if (!parentPairs.has(r.fromPersonId))
          parentPairs.set(r.fromPersonId, new Set());
        parentPairs.get(r.fromPersonId)!.add(r.toPersonId);
        if (!parentPairs.has(r.toPersonId))
          parentPairs.set(r.toPersonId, new Set());
        parentPairs.get(r.toPersonId)!.add(r.fromPersonId);
      }
    }

    for (const parentId of Array.from(childrenByParent.keys())) {
      const children = childrenByParent.get(parentId)!;
      const spouses = parentPairs.get(parentId);
      if (!spouses) continue;

      for (const spouseId of Array.from(spouses)) {
        const spouseChildren = childrenByParent.get(spouseId);
        if (!spouseChildren) continue;

        const sharedChildren = Array.from(children).filter((c) =>
          spouseChildren.has(c),
        );

        for (let i = 0; i < sharedChildren.length; i++) {
          for (let j = i + 1; j < sharedChildren.length; j++) {
            const a = nodes.get(sharedChildren[i]);
            const b = nodes.get(sharedChildren[j]);
            if (!a || !b) continue;

            if (!a.siblings.some((s) => s.id === b.id)) {
              a.siblings.push({ id: b.id, type: "blood" });
            }
            if (!b.siblings.some((s) => s.id === a.id)) {
              b.siblings.push({ id: a.id, type: "blood" });
            }
          }
        }
      }
    }

    let resultNodes: TreeNode[];
    if (rootId && nodes.has(rootId)) {
      const reachable = bfsFromRoot(rootId, nodes);
      const filtered = filterRelationsByNodes(reachable, nodes);
      resultNodes = Array.from(filtered.values());
    } else {
      resultNodes = Array.from(nodes.values());
    }

    return NextResponse.json({
      familyName: settings?.familyName || "Keluarga",
      updatedAt: settings?.updatedAt?.toISOString() || null,
      totalNodes,
      nodes: resultNodes,
    });
  } catch (error) {
    console.error("TREE ERROR", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
