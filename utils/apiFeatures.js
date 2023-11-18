class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) FILTERING
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) ADVANCED FILTERING
    let querystr = JSON.stringify(queryObj);
    querystr = querystr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // This is called filtering. OR querying the getAllTours method
    this.query = this.query.find(JSON.parse(querystr));
    return this; // it is necessary so that other methods can be chained after one another.
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.queryString.fields.split(',').join(' ')
      );
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // tours?page=2&limit=10 -> 1-10 on page 1, 11-20 on page 2
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
