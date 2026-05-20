import type { Filters, Preset, PresetKey, FormFieldEvent } from '../types';

interface Props {
  filters: Filters;
  presets: Preset[];
  presetName: string;
  exporting: boolean;
  meta: { total: number; pages: number };
  onFilterChange: (e: FormFieldEvent) => void;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onApplyPreset: (preset: Preset) => void;
  onDeletePreset: (name: string) => void;
  onExport: () => void;
  onQuickPreset: (preset: PresetKey) => void;
}

export default function LeadFilters({
  filters,
  presets,
  presetName,
  exporting,
  meta,
  onFilterChange,
  onPresetNameChange,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
  onExport,
  onQuickPreset,
}: Props) {
  return (
    <>
      <div className="card-header">
        <div>
          <h2>Leads</h2>
          <p className="subtle">{meta.total} total leads</p>
        </div>
        <button className="btn ghost" onClick={onExport} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="filters">
        <input
          name="search"
          placeholder="Search name or email"
          value={filters.search}
          onChange={onFilterChange}
        />
        <input type="date" name="startDate" value={filters.startDate} onChange={onFilterChange} />
        <input type="date" name="endDate" value={filters.endDate} onChange={onFilterChange} />
        <select name="sortBy" value={filters.sortBy} onChange={onFilterChange}>
          <option value="createdAt">Sort by date</option>
          <option value="firstName">Sort by first name</option>
          <option value="lastName">Sort by last name</option>
          <option value="email">Sort by email</option>
          <option value="status">Sort by status</option>
          <option value="source">Sort by source</option>
        </select>
        <select name="status" value={filters.status} onChange={onFilterChange}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
          <option value="pending">Pending</option>
        </select>
        <select name="source" value={filters.source} onChange={onFilterChange}>
          <option value="">All sources</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="social">Social</option>
          <option value="cold_call">Cold call</option>
          <option value="event">Event</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="cold_email">Cold email</option>
        </select>
        <select name="sort" value={filters.sort} onChange={onFilterChange}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <div className="preset-row">
        <button className="btn ghost tiny" onClick={() => onQuickPreset('new')}>New leads</button>
        <button className="btn ghost tiny" onClick={() => onQuickPreset('qualified')}>Qualified</button>
        <button className="btn ghost tiny" onClick={() => onQuickPreset('lost')}>Lost</button>
        <button className="btn ghost tiny" onClick={() => onQuickPreset('')}>Clear preset</button>
      </div>

      <div className="preset-save">
        <input
          placeholder="Save current filters as preset"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
        />
        <button className="btn ghost" onClick={onSavePreset}>Save preset</button>
      </div>

      {presets.length > 0 && (
        <div className="preset-list">
          {presets.map((preset) => (
            <div className="preset-chip" key={preset.name}>
              <button className="btn ghost tiny" onClick={() => onApplyPreset(preset)}>
                {preset.name}
              </button>
              <button className="btn ghost tiny" onClick={() => onDeletePreset(preset.name)}>×</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}