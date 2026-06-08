import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFinOpsStore } from "../store";

export function useFilteredFinOpsData() {
  const { managedKeys, members, searchQuery } = useFinOpsStore(
    useShallow((state) => ({
      managedKeys: state.managedKeys,
      members: state.members,
      searchQuery: state.searchQuery
    }))
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredKeys = useMemo(() => {
    if (!normalizedQuery) return managedKeys;
    return managedKeys.filter((key) => key.name.toLowerCase().includes(normalizedQuery) || key.maskedKey.toLowerCase().includes(normalizedQuery));
  }, [managedKeys, normalizedQuery]);

  const filteredMembers = useMemo(() => {
    if (!normalizedQuery) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.team.toLowerCase().includes(normalizedQuery) ||
        member.role.toLowerCase().includes(normalizedQuery)
    );
  }, [members, normalizedQuery]);

  return {
    filteredKeys,
    filteredMembers
  };
}
