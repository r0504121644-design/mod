import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FamilySpace,
  FamilyMember,
  Availability,
  ShiftAssignment,
  ShiftExchangeRequest,
  Medication,
  DoseRecord,
  DoseStatus,
  VitalRecord,
  Appointment,
  DischargeRecord,
  CareDocument,
  Professional,
  UpdateFeedItem,
  Alert,
  TaskItem,
  AgentMessage,
  AgentPermissions,
} from "./types";
import {
  SEED_FAMILY_SPACE,
  SEED_AVAILABILITY,
  SEED_SHIFTS,
  SEED_EXCHANGE_REQUESTS,
  SEED_MEDICATIONS,
  SEED_DOSES,
  SEED_VITALS,
  SEED_APPOINTMENTS,
  SEED_DISCHARGES,
  SEED_DOCUMENTS,
  SEED_PROFESSIONALS,
  SEED_UPDATES,
  SEED_ALERTS,
  SEED_TASKS,
} from "./seedData";
import { todayIso } from "./format";

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface AppState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  currentUserId: string;
  isPremium: boolean;

  familySpace: FamilySpace;
  tasks: TaskItem[];
  availability: Availability[];
  shifts: ShiftAssignment[];
  exchangeRequests: ShiftExchangeRequest[];
  medications: Medication[];
  doses: DoseRecord[];
  vitals: VitalRecord[];
  appointments: Appointment[];
  discharges: DischargeRecord[];
  documents: CareDocument[];
  professionals: Professional[];
  updates: UpdateFeedItem[];
  alerts: Alert[];

  agentMessages: AgentMessage[];
  agentPermissions: AgentPermissions;
  isAgentDrawerOpen: boolean;
  isSubscriptionModalOpen: boolean;

  login: () => void;
  logout: () => void;
  completeOnboarding: (space: FamilySpace) => void;
  setPremium: (v: boolean) => void;

  toggleTask: (id: string) => void;

  setAvailability: (a: Availability) => void;
  assignShift: (day: ShiftAssignment["day"], slot: ShiftAssignment["slot"], memberId: string | null) => void;
  requestExchange: (req: Omit<ShiftExchangeRequest, "id" | "status">) => void;
  resolveExchange: (id: string, status: "אושר" | "נדחה") => void;

  markDose: (id: string, status: DoseStatus, reason?: string, markedBy?: string) => void;
  addMedication: (m: Omit<Medication, "id">) => void;
  restockMedication: (id: string, amount: number) => void;

  addVital: (v: Omit<VitalRecord, "id">) => void;

  updateAppointmentChecklist: (appointmentId: string, itemId: string, checked: boolean) => void;
  addAppointment: (a: Omit<Appointment, "id" | "documentsChecklist">) => void;

  addDocument: (d: Omit<CareDocument, "id" | "date">) => void;
  addProfessional: (p: Omit<Professional, "id">) => void;
  postUpdate: (item: Omit<UpdateFeedItem, "id" | "timestamp">) => void;

  sendAgentMessage: (msg: AgentMessage) => void;
  clearAgentMessages: () => void;
  setAgentPermission: (key: keyof AgentPermissions, value: boolean) => void;
  openAgentDrawer: () => void;
  closeAgentDrawer: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      currentUserId: "dana",
      isPremium: false,

      familySpace: SEED_FAMILY_SPACE,
      tasks: SEED_TASKS,
      availability: SEED_AVAILABILITY,
      shifts: SEED_SHIFTS,
      exchangeRequests: SEED_EXCHANGE_REQUESTS,
      medications: SEED_MEDICATIONS,
      doses: SEED_DOSES,
      vitals: SEED_VITALS,
      appointments: SEED_APPOINTMENTS,
      discharges: SEED_DISCHARGES,
      documents: SEED_DOCUMENTS,
      professionals: SEED_PROFESSIONALS,
      updates: SEED_UPDATES,
      alerts: SEED_ALERTS,

      agentMessages: [],
      agentPermissions: {
        vitals: true,
        medications: true,
        appointments: true,
        documents: false,
        shifts: true,
      },
      isAgentDrawerOpen: false,
      isSubscriptionModalOpen: false,

      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      completeOnboarding: (space) => set({ familySpace: space, hasCompletedOnboarding: true }),
      setPremium: (v) => set({ isPremium: v }),

      toggleTask: (id) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }),

      setAvailability: (a) => {
        const others = get().availability.filter((x) => x.memberId !== a.memberId);
        set({ availability: [...others, a] });
      },

      assignShift: (day, slot, memberId) =>
        set({
          shifts: get().shifts.map((s) => (s.day === day && s.slot === slot ? { ...s, memberId } : s)),
        }),

      requestExchange: (req) =>
        set({
          exchangeRequests: [
            ...get().exchangeRequests,
            { ...req, id: uid("ex"), status: "ממתין" },
          ],
        }),

      resolveExchange: (id, status) => {
        const req = get().exchangeRequests.find((r) => r.id === id);
        if (req && status === "אושר" && req.toMemberId) {
          get().assignShift(req.day, req.slot, req.toMemberId);
        }
        set({
          exchangeRequests: get().exchangeRequests.map((r) => (r.id === id ? { ...r, status } : r)),
        });
      },

      markDose: (id, status, reason, markedBy) =>
        set({
          doses: get().doses.map((d) => (d.id === id ? { ...d, status, reason, markedBy } : d)),
        }),

      addMedication: (m) => set({ medications: [...get().medications, { ...m, id: uid("m") }] }),

      restockMedication: (id, amount) =>
        set({
          medications: get().medications.map((m) =>
            m.id === id ? { ...m, stock: m.stock + amount } : m
          ),
        }),

      addVital: (v) => set({ vitals: [...get().vitals, { ...v, id: uid("v") }] }),

      updateAppointmentChecklist: (appointmentId, itemId, checked) =>
        set({
          appointments: get().appointments.map((a) =>
            a.id === appointmentId
              ? {
                  ...a,
                  documentsChecklist: a.documentsChecklist.map((c) =>
                    c.id === itemId ? { ...c, checked } : c
                  ),
                }
              : a
          ),
        }),

      addAppointment: (a) =>
        set({
          appointments: [
            ...get().appointments,
            { ...a, id: uid("a"), documentsChecklist: [] },
          ],
        }),

      addDocument: (d) =>
        set({ documents: [...get().documents, { ...d, id: uid("doc"), date: todayIso() }] }),

      addProfessional: (p) =>
        set({ professionals: [...get().professionals, { ...p, id: uid("p") }] }),

      postUpdate: (item) =>
        set({
          updates: [{ ...item, id: uid("u"), timestamp: new Date().toISOString() }, ...get().updates],
        }),

      sendAgentMessage: (msg) => set({ agentMessages: [...get().agentMessages, msg] }),
      clearAgentMessages: () => set({ agentMessages: [] }),
      setAgentPermission: (key, value) =>
        set({ agentPermissions: { ...get().agentPermissions, [key]: value } }),
      openAgentDrawer: () => set({ isAgentDrawerOpen: true }),
      closeAgentDrawer: () => set({ isAgentDrawerOpen: false }),
      openSubscriptionModal: () => set({ isSubscriptionModalOpen: true }),
      closeSubscriptionModal: () => set({ isSubscriptionModalOpen: false }),
    }),
    {
      name: "lev-hamaavor-store",
      version: 1,
      skipHydration: true,
      partialize: (state) => {
        const { isAgentDrawerOpen, isSubscriptionModalOpen, ...rest } = state;
        return rest;
      },
    }
  )
);

export function getMemberById(members: FamilyMember[], id: string | null | undefined) {
  if (!id) return undefined;
  return members.find((m) => m.id === id);
}
