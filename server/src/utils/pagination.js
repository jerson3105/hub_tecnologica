const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginatedResponse = (rows, count, { page, limit }) => ({
  data: rows,
  pagination: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  }
});

module.exports = { paginate, paginatedResponse };
