const { supabaseAdmin } = require("../client/supabase");
const { createHttpError, isNonEmptyString } = require("./complaintController");

const assignComplaint = async (req, res, next) => {
  try {
    const complaintId = isNonEmptyString(req.body?.complaint_id)
      ? req.body.complaint_id.trim()
      : "";
    const assignedToId = isNonEmptyString(req.body?.assigned_to_id)
      ? req.body.assigned_to_id.trim()
      : "";
    const assignedToType = isNonEmptyString(req.body?.assigned_to_type)
      ? req.body.assigned_to_type.trim()
      : "field_staff";
    const assignedById = isNonEmptyString(req.body?.assigned_by_id)
      ? req.body.assigned_by_id.trim()
      : null;
    const dueAt = isNonEmptyString(req.body?.due_at) ? req.body.due_at.trim() : null;

    if (!complaintId || !assignedToId) {
      throw createHttpError(400, "complaint_id and assigned_to_id are required");
    }

    const { data: complaint, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select("id, status")
      .eq("id", complaintId)
      .single();

    if (complaintError) {
      if (complaintError.code === "PGRST116") {
        throw createHttpError(404, "Complaint not found");
      }
      throw complaintError;
    }

    const { error: deactivateError } = await supabaseAdmin
      .from("assignments")
      .update({ is_active: false })
      .eq("complaint_id", complaintId)
      .eq("is_active", true);

    if (deactivateError) {
      throw deactivateError;
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .insert({
        complaint_id: complaintId,
        assigned_to_id: assignedToId,
        assigned_to_type: assignedToType,
        assigned_by_id: assignedById,
        due_at: dueAt,
        is_active: true,
      })
      .select("id, complaint_id, assigned_to_id, assigned_to_type, assigned_by_id, due_at, is_active, created_at")
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    if (complaint.status !== "assigned") {
      const { error: statusError } = await supabaseAdmin
        .from("complaints")
        .update({ status: "assigned" })
        .eq("id", complaintId);

      if (statusError) {
        throw statusError;
      }
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: complaintId,
      event_type: "assigned",
      old_value: null,
      new_value: { assigned_to_id: assignedToId, assigned_to_type: assignedToType },
      actor_id: assignedById,
      actor_type: "admin",
      note: "Complaint assigned",
    });

    if (eventError) {
      throw eventError;
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const reassignComplaint = async (req, res, next) => {
  try {
    const assignmentId = isNonEmptyString(req.params.assignment_id)
      ? req.params.assignment_id.trim()
      : "";
    const reassignedToId = isNonEmptyString(req.body?.assigned_to_id)
      ? req.body.assigned_to_id.trim()
      : "";
    const reassignedToType = isNonEmptyString(req.body?.assigned_to_type)
      ? req.body.assigned_to_type.trim()
      : "field_staff";
    const assignedById = isNonEmptyString(req.body?.assigned_by_id)
      ? req.body.assigned_by_id.trim()
      : null;
    const dueAt = isNonEmptyString(req.body?.due_at) ? req.body.due_at.trim() : null;

    if (!assignmentId || !reassignedToId) {
      throw createHttpError(400, "assignment_id and assigned_to_id are required");
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("assignments")
      .select("id, complaint_id, assigned_to_id, assigned_to_type, is_active")
      .eq("id", assignmentId)
      .single();

    if (currentError) {
      if (currentError.code === "PGRST116") {
        throw createHttpError(404, "Assignment not found");
      }
      throw currentError;
    }

    const { error: closeCurrentError } = await supabaseAdmin
      .from("assignments")
      .update({ is_active: false })
      .eq("id", assignmentId);

    if (closeCurrentError) {
      throw closeCurrentError;
    }

    const { data: newAssignment, error: newAssignmentError } = await supabaseAdmin
      .from("assignments")
      .insert({
        complaint_id: current.complaint_id,
        assigned_to_id: reassignedToId,
        assigned_to_type: reassignedToType,
        assigned_by_id: assignedById,
        due_at: dueAt,
        is_active: true,
      })
      .select("id, complaint_id, assigned_to_id, assigned_to_type, assigned_by_id, due_at, is_active, created_at")
      .single();

    if (newAssignmentError) {
      throw newAssignmentError;
    }

    const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
      complaint_id: current.complaint_id,
      event_type: "reassigned",
      old_value: {
        assigned_to_id: current.assigned_to_id,
        assigned_to_type: current.assigned_to_type,
      },
      new_value: { assigned_to_id: reassignedToId, assigned_to_type: reassignedToType },
      actor_id: assignedById,
      actor_type: "admin",
      note: "Complaint reassigned",
    });

    if (eventError) {
      throw eventError;
    }

    res.status(200).json({ success: true, data: newAssignment });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const closeAssignment = async (req, res, next) => {
  try {
    const assignmentId = isNonEmptyString(req.params.assignment_id)
      ? req.params.assignment_id.trim()
      : "";
    const closedById = isNonEmptyString(req.body?.actor_id)
      ? req.body.actor_id.trim()
      : null;

    if (!assignmentId) {
      throw createHttpError(400, "assignment_id is required");
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .select("id, complaint_id, is_active")
      .eq("id", assignmentId)
      .single();

    if (assignmentError) {
      if (assignmentError.code === "PGRST116") {
        throw createHttpError(404, "Assignment not found");
      }
      throw assignmentError;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("assignments")
      .update({ is_active: false })
      .eq("id", assignmentId)
      .select("id, complaint_id, assigned_to_id, assigned_to_type, is_active, updated_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    if (assignment.is_active) {
      const { error: eventError } = await supabaseAdmin.from("complaint_events").insert({
        complaint_id: assignment.complaint_id,
        event_type: "assignment_closed",
        old_value: { is_active: true },
        new_value: { is_active: false },
        actor_id: closedById,
        actor_type: "admin",
        note: "Assignment closed",
      });

      if (eventError) {
        throw eventError;
      }
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  assignComplaint,
  reassignComplaint,
  closeAssignment,
};
