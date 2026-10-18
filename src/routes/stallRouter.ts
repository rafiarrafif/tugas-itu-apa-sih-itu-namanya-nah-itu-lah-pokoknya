import { Router } from "express";
import { StallController } from "../controllers/stallController.ts";
import { ReviewController } from "../controllers/reviewController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { requireRoles } from "../middleware/roleMiddleware.ts";

const stallRouter = Router();
const stallController = new StallController();
const reviewController = new ReviewController();

stallRouter.get("/", (req, res) => {
  // #swagger.parameters['search']   = { in: 'query', type: 'string', description: 'Search stall name (max 100 chars)', required: false }
  // #swagger.parameters['category'] = { in: 'query', type: 'string', description: 'Filter by category (max 50 chars)', required: false }
  // #swagger.parameters['page']     = { in: 'query', type: 'integer', description: 'Page number (default: 1, min: 1)', required: false }
  // #swagger.parameters['limit']    = { in: 'query', type: 'integer', description: 'Items per page (default: 10, min: 1, max: 100)', required: false }
  // #swagger.responses[200] = { description: 'List of stalls' }
  return stallController.getStalls(req, res);
});

stallRouter.post(
  "/",
  authMiddleware,
  requireRoles("admin", "owner"),
  (req, res) => {
    // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
    // #swagger.responses[201] = { description: 'Stall created successfully' }
    // #swagger.responses[400] = { description: 'Invalid input (name must be 3-100 chars, category max 50, location max 100, description max 1000)' }
    // #swagger.responses[401] = { description: 'Token tidak ditemukan atau tidak valid' }
    // #swagger.responses[403] = { description: 'User tidak memiliki izin' }
    // #swagger.responses[404] = { description: 'Owner not found' }
    return stallController.createStall(req, res);
  },
);

stallRouter.get("/:id", (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Stall details' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.getStallById(req, res);
});

stallRouter.put("/:id", (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/StallInput' } }
  // #swagger.responses[200] = { description: 'Stall updated' }
  // #swagger.responses[400] = { description: 'Invalid ID or invalid input' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.updateStall(req, res);
});

stallRouter.delete("/:id", (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Stall deleted' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.deleteStall(req, res);
});

stallRouter.get("/:id/reviews", (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1, min: 1)', required: false }
  // #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10, min: 1, max: 100)', required: false }
  // #swagger.responses[200] = { description: 'List of reviews for stall' }
  // #swagger.responses[400] = { description: 'Invalid ID (must be a positive integer)' }
  // #swagger.responses[404] = { description: 'Stall not found' }
  return stallController.getStallReviews(req, res);
});

stallRouter.post("/:id/reviews", authMiddleware, (req, res) => {
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['body'] = { in: 'body', required: true, schema: { $ref: '#/definitions/ReviewInputForStall' } }
  // #swagger.responses[201] = { description: 'Review created successfully' }
  // #swagger.responses[400] = { description: 'Invalid ID or invalid rating' }
  // #swagger.responses[401] = { description: 'Token tidak ditemukan atau tidak valid' }
  // #swagger.responses[404] = { description: 'Stall or user not found' }
  return reviewController.createReviewForStall(req, res);
});

stallRouter.get("/:stallId/reviews/:reviewId", (req, res) => {
  // #swagger.parameters['stallId'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['reviewId'] = { in: 'path', required: true, type: 'integer', description: 'Review ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Review details' }
  // #swagger.responses[400] = { description: 'Invalid ID' }
  // #swagger.responses[404] = { description: 'Review not found or does not belong to stall' }
  return reviewController.getReviewByIdForStall(req, res);
});

stallRouter.delete("/:stallId/reviews/:reviewId", (req, res) => {
  // #swagger.parameters['stallId'] = { in: 'path', required: true, type: 'integer', description: 'Stall ID (must be > 0)' }
  // #swagger.parameters['reviewId'] = { in: 'path', required: true, type: 'integer', description: 'Review ID (must be > 0)' }
  // #swagger.responses[200] = { description: 'Review deleted' }
  // #swagger.responses[400] = { description: 'Invalid ID' }
  // #swagger.responses[404] = { description: 'Review not found or does not belong to stall' }
  return reviewController.deleteReviewForStall(req, res);
});

export { stallRouter };
