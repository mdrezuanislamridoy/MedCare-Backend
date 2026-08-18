import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import {
  ModerateReviewDto,
  ReviewFilterDto,
  SubmitReviewDto,
} from './dto/review.dto';
import { ReviewStatus } from '../../../generated/prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(filter: ReviewFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.flagged !== undefined) {
      where.flagged = Boolean(filter.flagged);
    }
    if (filter.rating) {
      where.rating = Number(filter.rating);
    }
    if (filter.doctorId) {
      where.doctorId = filter.doctorId;
    }
    if (filter.q) {
      where.OR = [
        { content: { contains: filter.q, mode: 'insensitive' } },
        {
          patient: {
            user: { name: { contains: filter.q, mode: 'insensitive' } },
          },
        },
        {
          doctor: {
            user: { name: { contains: filter.q, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.doctorReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              clinic: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctorReview.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async moderateReview(id: string, dto: ModerateReviewDto, actorId?: string) {
    const review = await this.prisma.doctorReview.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    let status: ReviewStatus = review.status;
    let flagged = review.flagged;
    let flagReason = review.flagReason;

    switch (dto.action) {
      case 'PUBLISH':
        status = ReviewStatus.PUBLISHED;
        flagged = false;
        break;
      case 'HIDE':
        status = ReviewStatus.HIDDEN;
        break;
      case 'FLAG':
        status = ReviewStatus.UNDER_REVIEW;
        flagged = true;
        flagReason = dto.reason || 'Flagged by Admin';
        break;
      case 'DISMISS_FLAG':
        flagged = false;
        status = ReviewStatus.PUBLISHED;
        break;
    }

    const updated = await this.prisma.doctorReview.update({
      where: { id },
      data: {
        status,
        flagged,
        flagReason,
        moderatedById: actorId,
        moderatedAt: new Date(),
      },
    });

    // Recalculate doctor rating based on published reviews
    const aggregate = await this.prisma.doctorReview.aggregate({
      where: {
        doctorId: review.doctorId,
        status: ReviewStatus.PUBLISHED,
      },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.doctorProfile
      .update({
        where: { id: review.doctorId },
        data: {
          rating: aggregate._avg.rating
            ? Number(aggregate._avg.rating.toFixed(1))
            : 5.0,
          reviewCount: aggregate._count || 0,
        },
      })
      .catch(() => null);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: `Review Moderated (${dto.action})`,
          resource: `Review #${id} for Dr. ${review.doctor.user.name || review.doctor.user.email}`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

    return updated;
  }

  // --- Patient Portal Methods ---

  private async getPatientIdFromUserId(userId: string): Promise<string> {
    let profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.patientProfile.create({
        data: { userId },
      });
    }
    return profile.id;
  }

  async patientListPendingReviews(userId: string) {
    const patientId = await this.getPatientIdFromUserId(userId);

    // Completed appointments that haven't been reviewed yet
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        patientId,
        status: 'COMPLETED',
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true } },
            clinic: true,
          },
        },
        clinic: true,
      },
      orderBy: { date: 'desc' },
    });

    const reviews = await this.prisma.doctorReview.findMany({
      where: { patientId },
      select: { doctorId: true },
    });
    const reviewedDoctorIds = new Set(reviews.map((r) => r.doctorId));

    const pending = completedAppointments
      .filter((a) => !reviewedDoctorIds.has(a.doctorId))
      .map((a) => ({
        appointmentId: a.id,
        doctorId: a.doctorId,
        doctorName: a.doctor.user.name,
        specialty: a.doctor.specialty,
        clinicName: a.clinic?.name || a.doctor.clinic?.name || 'MedCare Center',
        date: a.date,
      }));

    return pending;
  }

  async patientSubmitReview(userId: string, dto: SubmitReviewDto) {
    const patientId = await this.getPatientIdFromUserId(userId);

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = await this.prisma.doctorReview.create({
      data: {
        patientId,
        doctorId: dto.doctorId,
        rating: Math.round(dto.rating),
        content: dto.content,
        status: ReviewStatus.PUBLISHED,
      },
    });

    // Update doctor average rating
    const aggregate = await this.prisma.doctorReview.aggregate({
      where: {
        doctorId: dto.doctorId,
        status: ReviewStatus.PUBLISHED,
      },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.doctorProfile.update({
      where: { id: dto.doctorId },
      data: {
        rating: aggregate._avg.rating
          ? Number(aggregate._avg.rating.toFixed(1))
          : dto.rating,
        reviewCount: aggregate._count || 1,
      },
    });

    return review;
  }

  async patientListMyReviews(userId: string) {
    const patientId = await this.getPatientIdFromUserId(userId);
    return this.prisma.doctorReview.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true } },
            clinic: true,
          },
        },
      },
    });
  }
}
