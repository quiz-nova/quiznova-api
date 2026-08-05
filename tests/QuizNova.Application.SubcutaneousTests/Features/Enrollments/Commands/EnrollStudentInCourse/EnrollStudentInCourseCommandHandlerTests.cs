using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Enrollments.Commands.EnrollStudentInCourse;
using QuizNova.Application.Features.Students.Commands.CreateStudent;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Courses;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Enrollments.Commands.EnrollStudentInCourse;

public class EnrollStudentInCourseCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithValidData_ShouldEnrollStudentSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a student
        var studentEmail = $"student_{Guid.NewGuid()}@example.com";
        var studentPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var studentResult = await mediator.Send(new CreateStudentCommand(
            PersonalInformation: new PersonalInformationDto("Enroll Student", studentEmail, studentPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Student)));
        studentResult.IsSuccess.Should().BeTrue();
        var studentId = studentResult.Value.Id;

        // 2. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Enrollment Course",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // Act
        var enrollResult = await mediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));

        // Assert
        enrollResult.IsSuccess.Should()
            .BeTrue($"because enrollment should succeed, but failed with: {enrollResult.TopError.Description}");

        // Verify enrollment exists in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var enrollment = await mongoContext.Enrollments.Find(e => e.StudentId == studentId && e.CourseId == courseId).FirstOrDefaultAsync();
        enrollment.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WithEmptyCourseId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new EnrollStudentInCourseCommand(Guid.Empty, Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<EnrollStudentInCourseCommand>(x => x.CourseId) &&
            e.Description == EnrollStudentInCourseCommandValidator.ErrorMessages.CourseIdRequired);
    }

    [Fact]
    public async Task Handle_WithEmptyStudentId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new EnrollStudentInCourseCommand(Guid.NewGuid(), Guid.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<EnrollStudentInCourseCommand>(x => x.StudentId) &&
            e.Description == EnrollStudentInCourseCommandValidator.ErrorMessages.StudentIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentCourse_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new EnrollStudentInCourseCommand(Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.CourseNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithNonExistentStudent_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a real course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course For Bad Student",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // 2. Use a non-existent student ID
        var command = new EnrollStudentInCourseCommand(courseId, Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.StudentNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithCompletedCourse_ShouldReturnError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a student
        var studentEmail = $"student_{Guid.NewGuid()}@example.com";
        var studentPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var studentResult = await mediator.Send(new CreateStudentCommand(
            PersonalInformation: new PersonalInformationDto("Student Completed", studentEmail, studentPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Student)));
        studentResult.IsSuccess.Should().BeTrue();
        var studentId = studentResult.Value.Id;

        // 2. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course To Complete",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // 3. Mark course as completed directly via DbContext
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
            course.Should().NotBeNull();
            course.MarkAsCompeleted();
            await mongoContext.Courses.ReplaceOneAsync(c => c.Id == courseId, course);
        }

        // Act — try to enroll in a completed course
        var actMediator = factory.CreateMediator();
        var enrollResult = await actMediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));

        // Assert
        enrollResult.IsError.Should().BeTrue();
        enrollResult.TopError.Code.Should().Be(CourseErrors.CannotEnrollInCompletedCourse.Code);
    }

    [Fact]
    public async Task Handle_WithAlreadyEnrolledStudent_ShouldReturnError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a student
        var studentEmail = $"student_{Guid.NewGuid()}@example.com";
        var studentPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var studentResult = await mediator.Send(new CreateStudentCommand(
            PersonalInformation: new PersonalInformationDto("Duplicate Enroll Student", studentEmail, studentPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Student)));
        studentResult.IsSuccess.Should().BeTrue();
        var studentId = studentResult.Value.Id;

        // 2. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course Duplicate Enroll",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        var enrollCommand = new EnrollStudentInCourseCommand(courseId, studentId);

        // Act — enroll once (succeeds), then again (should fail)
        var firstEnroll = await mediator.Send(enrollCommand);
        var secondEnroll = await mediator.Send(enrollCommand);

        // Assert
        firstEnroll.IsSuccess.Should().BeTrue();
        secondEnroll.IsError.Should().BeTrue();
        secondEnroll.TopError.Code.Should().Be(CourseErrors.StudentAlreadyEnrolled(Guid.Empty).Code);
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
