using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Enrollments.Commands.EnrollStudentInCourse;
using QuizNova.Application.Features.Enrollments.Queries.GetStudentEnrollmentsById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;

namespace QuizNova.Application.SubcutaneousTests.Features.Enrollments.Queries.GetStudentEnrollmentsById;

public class GetStudentEnrollmentsByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyStudentId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentEnrollmentsByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetStudentEnrollmentsByIdQuery>(x => x.StudentId) &&
            e.Description == GetStudentEnrollmentsByIdQueryValidator.ErrorMessages.StudentIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentStudentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentEnrollmentsByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Student.NotFound");
    }

    [Fact]
    public async Task Handle_WithValidStudentIdWithEnrollments_ShouldReturnEnrollments()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // Use pre-seeded student and course
        Guid studentId;
        Guid courseId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var student = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student).FirstAsync();
            studentId = student.Id;

            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
        }

        // We know DbInitializer seeds enrollments for every student to every course
        // But just to ensure one exists specifically:
        await mediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));

        // Act
        var result = await mediator.Send(new GetStudentEnrollmentsByIdQuery(studentId));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        result.Value.Should().Contain(e => e.CourseId == courseId);
    }
}
