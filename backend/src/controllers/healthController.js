const getHealth = (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
  });
};

module.exports = {
  getHealth,
};
