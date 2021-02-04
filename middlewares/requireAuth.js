module.exports = (req, res) => {
  if (!req.user) {
    return res.status(401).send({ error: 'You must log in!' });
  }

  next();
};
