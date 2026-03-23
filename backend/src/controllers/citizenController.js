const { supabaseAdmin } = require("../client/supabase");
const { createHttpError, isNonEmptyString } = require("./complaintController");

const getCitizenByPhone = async (req, res, next) => {
  try {
    const phoneNumber = isNonEmptyString(req.params.phone_number)
      ? req.params.phone_number.trim()
      : "";

    if (!phoneNumber) {
      throw createHttpError(400, "phone_number is required");
    }

    const { data, error } = await supabaseAdmin
      .from("citizens")
      .select("id, phone_number, name, preferred_language, created_at, updated_at")
      .eq("phone_number", phoneNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw createHttpError(404, "Citizen not found");
      }
      throw error;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const getCitizenHistory = async (req, res, next) => {
  try {
    const phoneNumber = isNonEmptyString(req.params.phone_number)
      ? req.params.phone_number.trim()
      : "";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    if (!phoneNumber) {
      throw createHttpError(400, "phone_number is required");
    }

    const { data: citizen, error: citizenError } = await supabaseAdmin
      .from("citizens")
      .select("id, phone_number, name, preferred_language, created_at")
      .eq("phone_number", phoneNumber)
      .single();

    if (citizenError) {
      if (citizenError.code === "PGRST116") {
        throw createHttpError(404, "Citizen not found");
      }
      throw citizenError;
    }

    const { data: complaints, error: complaintError } = await supabaseAdmin
      .from("complaints")
      .select(
        "id, complaint_number, status, channel, priority, category, location_text, created_at, resolved_at"
      )
      .eq("citizen_id", citizen.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (complaintError) {
      throw complaintError;
    }

    res.status(200).json({
      success: true,
      data: {
        citizen,
        complaints: complaints || [],
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

module.exports = {
  getCitizenByPhone,
  getCitizenHistory,
};
