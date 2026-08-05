using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Courses.Commands.UpdateCourseInstructor;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Courses;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Courses.Commands.UpdateCourseInstructor;

public class UpdateCourseInstructorCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyCourseId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new UpdateCourseInstructorCommand(Guid.Empty, null);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateCourseInstructorCommand>(x => x.CourseId) &&
            e.Description == UpdateCourseInstructorCommandValidator.ErrorMessages.CourseIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentCourseId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new UpdateCourseInstructorCommand(Guid.NewGuid(), null);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.CourseNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithNonExistentInstructor_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a course
        var createCourseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course No Instructor",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        createCourseResult.IsSuccess.Should().BeTrue();
        var courseId = createCourseResult.Value.Id;

        // 2. Try to assign a non-existent instructor
        var command = new UpdateCourseInstructorCommand(courseId, Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithValidCourseAndInstructor_ShouldUpdateInstructorSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create an instructor
        var instructorEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var instructorPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var instructorResult = await mediator.Send(new CreateInstructorCommand(
            PersonalInformation: new PersonalInformationDto("New Instructor", instructorEmail, instructorPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Instructor)));
        instructorResult.IsSuccess.Should().BeTrue();
        var instructorId = instructorResult.Value.Id;

        // 2. Create a course without instructor
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course For Update",
            InstructorId: null,
            MinimumPassingMarks: 60,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // Act
        var updateResult = await mediator.Send(new UpdateCourseInstructorCommand(courseId, instructorId));

        // Assert
        updateResult.IsSuccess.Should()
            .BeTrue($"because update should succeed, but failed with: {updateResult.TopError.Description}");
        updateResult.Value.InstructorId.Should().Be(instructorId);

        // Verify in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.InstructorId.Should().Be(instructorId);
    }

    [Fact]
    public async Task Handle_WithNullInstructor_ShouldRemoveInstructor()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create an instructor
        var instructorEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var instructorPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var instructorResult = await mediator.Send(new CreateInstructorCommand(
            PersonalInformation: new PersonalInformationDto("Removable Instructor", instructorEmail, instructorPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Instructor)));
        instructorResult.IsSuccess.Should().BeTrue();
        var instructorId = instructorResult.Value.Id;

        // 2. Create a course WITH that instructor
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course Remove Instructor",
            InstructorId: instructorId,
            MinimumPassingMarks: 60,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // Act — set instructor to null (unassign)
        var updateResult = await mediator.Send(new UpdateCourseInstructorCommand(courseId, null));

        // Assert
        updateResult.IsSuccess.Should()
            .BeTrue(
                $"because removing instructor should succeed, but failed with: {updateResult.TopError.Description}");
        updateResult.Value.InstructorId.Should().BeNull();

        // Verify in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.InstructorId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithCompletedCourse_ShouldReturnError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a course
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Completed Course",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();
        var courseId = courseResult.Value.Id;

        // 2. Mark course as completed directly via DbContext (no application command for this)
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var course = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
            course.Should().NotBeNull();
            course.MarkAsCompeleted();
            await mongoContext.Courses.ReplaceOneAsync(c => c.Id == courseId, course);
        }

        // Act — try to update instructor on a completed course
        var actMediator = factory.CreateMediator();
        var updateResult = await actMediator.Send(new UpdateCourseInstructorCommand(courseId, null));

        // Assert
        updateResult.IsError.Should().BeTrue();
        updateResult.TopError.Code.Should().Be(CourseErrors.CannotUpdateCompletedCourse.Code);
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
