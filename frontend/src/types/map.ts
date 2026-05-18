export interface ProvenanceNode {
  type: string;
  id: string;
  title?: string;
  text?: string;
  classification?: string;
  name?: string;
}

export interface SimilarMapRef {
  map_id: string;
  title: string;
  status: string;
}

export interface TriageMapCard {
  map_id?: string;
  gap_id: string;
  title: string;
  description: string;
  status: string;
  historical_match_count: number;
  confidence_score: number;
  similar_policies_count?: number;
  provenance_path: ProvenanceNode[];
  similar_past_maps: SimilarMapRef[];
  suggested_evidence: string[];
  deadline: string;
  priority_score: number;
  risk_level: string;
  clause_text: string;
  circular_id: string;
  circular_title?: string;
  routing: string;
  gap_status: string;
  severity?: string;
  department_id?: string;
  department_name?: string;
  suggested_department_id?: string;
}

export interface TriageAction {
  action_id: string;
  map_id?: string;
  gap_id?: string;
  timestamp: string;
  officer_name: string;
  decision: string;
  title?: string;
}

export interface MapListItem {
  map_id: string;
  title: string;
  status: string;
  owner_department_id: string;
  department_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  deadline: string;
  priority_score: number;
  risk_level: string;
  evidence_completion_pct: number;
  days_until_deadline: number;
  is_overdue: boolean;
}

export interface MapDetail {
  map_id: string;
  title: string;
  description: string;
  requirements: string[];
  status: string;
  priority_score: number;
  risk_level: string;
  provenance_path: ProvenanceNode[];
  evidence_items: { evidence_type: string; label: string; required: boolean; uploaded: boolean }[];
  audit_trail: { timestamp: string; user_name?: string; action: string; details?: string }[];
  timeline: { stage: string; label: string; completed: boolean; timestamp?: string }[];
  deadline: string;
  department_name?: string;
  clause_text?: string;
  historical_match_count: number;
  confidence_score: number;
  similar_past_maps: SimilarMapRef[];
}
