// Feature: client-payment-tracking
// Task: 8 - Implement API endpoints

import express, { Request, Response } from 'express';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentValidator } from '../services/PaymentValidator';
import { BalanceCalculator } from '../services/BalanceCalculator';
import { PaymentStatusClassifier } from '../services/PaymentStatusClassifier';
import { CreatePaymentData, UpdatePaymentData, DocumentType } from '../types/payment.types';

export function createPaymentRoutes(paymentRepository: PaymentRepository) {
    const router = express.Router();
    const validator = new PaymentValidator();
    const balanceCalculator = new BalanceCalculator();
    const statusClassifier = new PaymentStatusClassifier();

    /**
     * POST /api/payments
     * Create a new payment
     */
    router.post('/', async (req: Request, res: Response) => {
        try {
            const { documentType, documentId, paymentDate, amount, paymentMethod, notes } = req.body;
            const tenantId = (req as any).tenantId; // Assuming auth middleware sets this
            const userId = (req as any).userId; // Assuming auth middleware sets this

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            const paymentData: Partial<CreatePaymentData> = {
                tenantId,
                documentType,
                documentId,
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                amount,
                paymentMethod,
                notes
            };

            // Validate payment data
            const validationResult = validator.validateCreate(paymentData as CreatePaymentData);
            if (!validationResult.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid payment data',
                        details: validationResult.errors
                    }
                });
            }

            // Create payment
            const payment = await paymentRepository.create(paymentData as CreatePaymentData, userId);

            return res.status(201).json({
                success: true,
                data: payment
            });
        } catch (error: any) {
            console.error('Error creating payment:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create payment',
                    details: error.message
                }
            });
        }
    });

    /**
     * GET /api/payments
     * Get payments for a document
     */
    router.get('/', async (req: Request, res: Response) => {
        try {
            const { documentType, documentId } = req.query;
            const tenantId = (req as any).tenantId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            if (!documentType || !documentId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required parameters: documentType and documentId'
                    }
                });
            }

            const payments = await paymentRepository.findByDocument(
                documentType as DocumentType,
                parseInt(documentId as string),
                tenantId
            );

            return res.status(200).json({
                success: true,
                data: payments
            });
        } catch (error: any) {
            console.error('Error fetching payments:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch payments',
                    details: error.message
                }
            });
        }
    });

    /**
     * GET /api/payments/:id
     * Get a single payment by ID
     */
    router.get('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const tenantId = (req as any).tenantId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            const payment = await paymentRepository.findById(parseInt(id), tenantId);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Payment not found'
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: payment
            });
        } catch (error: any) {
            console.error('Error fetching payment:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch payment',
                    details: error.message
                }
            });
        }
    });

    /**
     * PUT /api/payments/:id
     * Update a payment
     */
    router.put('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { paymentDate, amount, paymentMethod, notes } = req.body;
            const tenantId = (req as any).tenantId;
            const userId = (req as any).userId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            const updates: UpdatePaymentData = {
                paymentDate: paymentDate ? new Date(paymentDate) : undefined,
                amount,
                paymentMethod,
                notes,
                updatedBy: userId
            };

            // Validate updates
            const validationResult = validator.validateUpdate(updates);
            if (!validationResult.isValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid payment data',
                        details: validationResult.errors
                    }
                });
            }

            const payment = await paymentRepository.update(parseInt(id), updates, userId, tenantId);

            return res.status(200).json({
                success: true,
                data: payment
            });
        } catch (error: any) {
            console.error('Error updating payment:', error);
            
            if (error.message === 'Payment not found') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Payment not found'
                    }
                });
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to update payment',
                    details: error.message
                }
            });
        }
    });

    /**
     * DELETE /api/payments/:id
     * Delete a payment
     */
    router.delete('/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const tenantId = (req as any).tenantId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            await paymentRepository.delete(parseInt(id), tenantId);

            return res.status(200).json({
                success: true,
                message: 'Payment deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting payment:', error);
            
            if (error.message === 'Payment not found') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Payment not found'
                    }
                });
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to delete payment',
                    details: error.message
                }
            });
        }
    });

    /**
     * GET /api/payments/balance
     * Get document balance
     */
    router.get('/balance', async (req: Request, res: Response) => {
        try {
            const { documentType, documentId } = req.query;
            const tenantId = (req as any).tenantId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            if (!documentType || !documentId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required parameters: documentType and documentId'
                    }
                });
            }

            // Get payments for document
            const payments = await paymentRepository.findByDocument(
                documentType as DocumentType,
                parseInt(documentId as string),
                tenantId
            );

            // TODO: Get document total amount from appropriate table
            // For now, we'll need to fetch this from detail_bl or factures table
            // This should be implemented based on your existing database structure
            
            const documentTotalAmount = 0; // Placeholder - needs implementation

            const totalPaid = balanceCalculator.calculateTotalPaid(payments);
            const balance = balanceCalculator.calculateBalance(documentTotalAmount, payments);
            const status = statusClassifier.classifyStatus(balance, documentTotalAmount);

            return res.status(200).json({
                success: true,
                data: {
                    totalAmount: documentTotalAmount,
                    totalPaid,
                    balance,
                    status
                }
            });
        } catch (error: any) {
            console.error('Error calculating balance:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to calculate balance',
                    details: error.message
                }
            });
        }
    });

    /**
     * GET /api/payments/outstanding
     * Get outstanding balances dashboard
     */
    router.get('/outstanding', async (req: Request, res: Response) => {
        try {
            const { documentType, clientId, sortBy, sortOrder } = req.query;
            const tenantId = (req as any).tenantId;

            if (!tenantId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required'
                    }
                });
            }

            const filters = {
                documentType: documentType as DocumentType | undefined,
                clientId: clientId ? parseInt(clientId as string) : undefined
            };

            const sorting = {
                sortBy: (sortBy as string) || 'balance',
                sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
            };

            const outstandingBalances = await paymentRepository.getOutstandingBalances(
                tenantId,
                filters,
                sorting
            );

            return res.status(200).json({
                success: true,
                data: outstandingBalances
            });
        } catch (error: any) {
            console.error('Error fetching outstanding balances:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch outstanding balances',
                    details: error.message
                }
            });
        }
    });

    return router;
}
