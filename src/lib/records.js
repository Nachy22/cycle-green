import { supabase } from './supabaseClient';

// --- Community member: submit a record ---
export async function uploadPhoto(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const { error } = await supabase.storage
    .from('planting-evidence')
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from('planting-evidence')
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function createPlantingRecord({ photoUrl, lat, lng, description, community, treeCount }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('planting_records')
    .insert({
      user_id: user.id,
      photo_url: photoUrl,
      gps_lat: lat,
      gps_lng: lng,
      description,
      community,
      tree_count: treeCount,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyRecords() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('planting_records')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// --- Admin: review queue ---
export async function getPendingRecords() {
  const { data, error } = await supabase
    .from('planting_records')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function verifyRecord(recordId, notes = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('planting_records')
    .update({
      status: 'verified',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data; // ledger row is auto-created by your existing trigger
}

export async function rejectRecord(recordId, notes = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('planting_records')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Ledger view ---
export async function getLedger() {
  const { data, error } = await supabase
    .from('credit_ledger')
    .select('*, planting_records(description, community, gps_lat, gps_lng, user_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}