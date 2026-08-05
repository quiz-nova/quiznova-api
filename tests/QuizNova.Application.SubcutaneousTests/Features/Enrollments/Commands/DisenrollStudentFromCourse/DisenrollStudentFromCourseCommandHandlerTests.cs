using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Enrollments.Commands.DisenrollStudentFromCourse;
using QuizNova.Application.Features.Enrollments.Commands.EnrollStudentInCourse;
using QuizNova.Application.Features.Students.Commands.CreateStudent;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Enrollments.Commands.DisenrollStudentFromCourse;

public class DisenrollStudentFromCourseCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyEnrollmentId_ShouldReturnValidationError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new DisenrollStudentFromCourseCommand(Guid.Empty, Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<DisenrollStudentFromCourseCommand>(x => x.EnrollmentId) &&
            e.Description == DisenrollStudentFromCourseCommandValidator.ErrorMessages.EnrollmentIdRequired);
    }

    [Fact]
    public async Task Handle_WithEmptyStudentId_ShouldReturnValidationError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new DisenrollStudentFromCourseCommand(Guid.NewGuid(), Guid.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<DisenrollStudentFromCourseCommand>(x => x.StudentId) &&
            e.Description == DisenrollStudentFromCourseCommandValidator.ErrorMessages.StudentIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentEnrollment_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new DisenrollStudentFromCourseCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.EnrollmentNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithValidEnrollment_ShouldRemoveSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a student
        var studentEmail = $"student_{Guid.NewGuid()}@example.com";
        var studentPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var studentResult = await mediator.Send(new CreateStudentCommand(
            PersonalInformation: new PersonalInformationDto("Remove Student", studentEmail, studentPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Student)));
        studentResult.IsSuccess.Should().BeTrue();
        var studentId = studentResult.Value.Id;

        // 2. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course For Remove",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // 3. Enroll the student
        var enrollResult = await mediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));
        enrollResult.IsSuccess.Should().BeTrue();

        // 4. Retrieve the enrollment ID from the database
        Guid enrollmentId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var enrollment = await mongoContext.Enrollments.Find(e => e.StudentId == studentId && e.CourseId == courseId).FirstOrDefaultAsync();
            enrollment.Should().NotBeNull();
            enrollmentId = enrollment.Id;
        }

        // Act
        var removeResult = await mediator.Send(new DisenrollStudentFromCourseCommand(enrollmentId, studentId));

        // Assert
        removeResult.IsSuccess.Should()
            .BeTrue($"because removal should succeed, but failed with: {removeResult.TopError.Description}");

        // Verify enrollment is gone from database
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var enrollmentInDb = await verifyDb.Enrollments.Find(e => e.Id == enrollmentId).FirstOrDefaultAsync();
        enrollmentInDb.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithAlreadyRemovedEnrollment_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a student
        var studentEmail = $"student_{Guid.NewGuid()}@example.com";
        var studentPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var studentResult = await mediator.Send(new CreateStudentCommand(
            PersonalInformation: new PersonalInformationDto("Double Remove Student", studentEmail, studentPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Student)));
        studentResult.IsSuccess.Should().BeTrue();
        var studentId = studentResult.Value.Id;

        // 2. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course Double Remove",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // 3. Enroll the student
        var enrollResult = await mediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));
        enrollResult.IsSuccess.Should().BeTrue();

        // 4. Retrieve the enrollment ID
        Guid enrollmentId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var enrollment = await mongoContext.Enrollments.Find(e => e.StudentId == studentId && e.CourseId == courseId).FirstOrDefaultAsync();
            enrollment.Should().NotBeNull();
            enrollmentId = enrollment.Id;
        }

        var removeCommand = new DisenrollStudentFromCourseCommand(enrollmentId, studentId);

        // Act
        var removeResult1 = await mediator.Send(removeCommand);
        var removeResult2 = await mediator.Send(removeCommand);

        // Assert
        removeResult1.IsSuccess.Should().BeTrue();
        removeResult2.IsError.Should().BeTrue();
        removeResult2.TopError.Code.Should().Be(ApplicationErrors.EnrollmentNotFound(Guid.Empty).Code);

        // Verify enrollment is still absent in database
        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var enrollmentInDb = await verifyDb.Enrollments.Find(e => e.Id == enrollmentId).FirstOrDefaultAsync();
        enrollmentInDb.Should().BeNull();
    }

    private void EnsureAdminContext()
    {
        var adminId = Guid.Parse(TestUsers.Admin.User.Id);
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        if (!mongoContext.Users.Find(u => u.UserRole == UserRole.Admin && u.Id == adminId).Any())
        {
            var personalInfo = PersonalInformation.Create("Admin User", "admin@quiznova.local", "01000000000").Value;
            var admin = Admin.Create(adminId, personalInfo).Value;
            mongoContext.Users.InsertOne(admin);
        }

        TestCurrentUser.Set(TestUsers.Admin.User);
    }
}
