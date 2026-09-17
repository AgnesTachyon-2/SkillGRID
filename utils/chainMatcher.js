// Multi-node chain-matching algorithm.
// Builds a directed graph where an edge User A -> User B exists if A wants
// a skill that B offers. Finds cycles (A -> B -> C -> A) up to maxChainLength,
// representing a continuous fulfillment loop where everyone both teaches and learns.
function findChainMatches(users, { maxChainLength = 4 } = {}) {
  // users: [{ id, offered: [skill,...], wanted: [skill,...] }]
  const graph = new Map(); // userId -> [{ toUserId, skillTaughtByFrom }]

  for (const a of users) {
    graph.set(a.id, []);
  }

  for (const a of users) {
    for (const wantedSkill of a.wanted) {
      for (const b of users) {
        if (b.id === a.id) continue;
        if (b.offered.includes(wantedSkill)) {
          // a wants a skill that b offers -> edge a -> b, meaning b teaches a
          graph.get(a.id).push({ toUserId: b.id, skillFromBToA: wantedSkill });
        }
      }
    }
  }

  const foundCycles = [];
  const seenCycleKeys = new Set();

  // A cycle discovered starting from any of its members is the same cycle.
  // Canonicalize by rotating the participant/edge lists to start at the
  // lowest user id before computing the dedup key, so A->B->C->A and
  // B->C->A->B and C->A->B->C all collapse to one entry.
  function canonicalize(participants, edges) {
    let minIdx = 0;
    for (let i = 1; i < participants.length; i++) {
      if (participants[i] < participants[minIdx]) minIdx = i;
    }
    const rotatedParticipants = [...participants.slice(minIdx), ...participants.slice(0, minIdx)];
    const rotatedEdges = [...edges.slice(minIdx), ...edges.slice(0, minIdx)];
    return { participants: rotatedParticipants, edges: rotatedEdges };
  }

  function dfs(startId, currentId, path, edgesTaken, visited) {
    if (path.length > maxChainLength) return;
    const neighbors = graph.get(currentId) || [];
    for (const edge of neighbors) {
      if (edge.toUserId === startId && path.length >= 2) {
        const closingEdge = { fromUserId: currentId, toUserId: startId, skillFromToTo: edge.skillFromBToA };
        const canonical = canonicalize([...path], [...edgesTaken, closingEdge]);
        const key = canonical.participants.join('>');
        if (!seenCycleKeys.has(key)) {
          seenCycleKeys.add(key);
          foundCycles.push({ participants: canonical.participants, edges: canonical.edges });
        }
        continue;
      }
      if (visited.has(edge.toUserId)) continue;
      visited.add(edge.toUserId);
      dfs(startId, edge.toUserId, [...path, edge.toUserId], [...edgesTaken, { fromUserId: currentId, toUserId: edge.toUserId, skillFromToTo: edge.skillFromBToA }], visited);
      visited.delete(edge.toUserId);
    }
  }

  for (const a of users) {
    dfs(a.id, a.id, [a.id], [], new Set([a.id]));
  }

  // Filter out cycles that are just direct 2-person swaps (those are handled as direct matches)
  return foundCycles.filter((c) => c.participants.length >= 3);
}

module.exports = { findChainMatches };
