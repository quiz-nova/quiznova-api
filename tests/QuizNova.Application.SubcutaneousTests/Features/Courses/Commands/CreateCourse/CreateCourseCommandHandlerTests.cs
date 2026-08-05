using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Courses;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Courses.Commands.CreateCourse;

public class CreateCourseCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithValidData_ShouldCreateCourseSuccessfully()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        EnsureAdminContext();
        var command = new CreateCourseCommand(
            Name: "Valid Course Name",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because creation should succeed but failed with: {result.TopError.Description}");
        result.Value.Should().NotBeNull();
        result.Value.CourseName.Should().Be("Valid Course Name");

        // Verify existence in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == result.Value.Id).FirstOrDefaultAsync();

        courseInDb.Should().NotBeNull();
        courseInDb.Name.Should().Be("Valid Course Name");
        courseInDb.MinimumPassingMarks.Should().Be(50);
        courseInDb.MaximumMarks.Should().Be(100);
    }

    [Fact]
    public async Task Handle_WithEmptyName_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: string.Empty,
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.Name) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.NameRequired);
    }

    [Fact]
    public async Task Handle_WithNameLessThanThreeChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "AB",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.Name) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.NameMinLength);
    }

    [Fact]
    public async Task Handle_WithNameGreaterThanThirtyChars_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: new string('A', 31),
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.Name) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.NameMaxLength);
    }

    [Fact]
    public async Task Handle_WithNamePaddedWithSpacesAndLessThanThreePureChars_ShouldReturnValidationError()
    {
        // Arrange
        EnsureAdminContext();

        // " AB " has raw length 4 — passes FluentValidation MinimumLength(3)
        // but domain trims it to "AB" (2 pure chars) and rejects it
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: " AB ",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(CourseErrors.NameInvalid.Code);
    }

    [Fact]
    public async Task Handle_WithNameExactlyThreeChars_ShouldCreateCourseSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "ABC",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because 3-char name is at the lower boundary, but failed with: {result.TopError.Description}");

        // Verify existence in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == result.Value.Id).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.Name.Should().Be("ABC");
    }

    [Fact]
    public async Task Handle_WithNameExactlyThirtyChars_ShouldCreateCourseSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var longName = new string('A', 30);
        var command = new CreateCourseCommand(
            Name: longName,
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because 30-char name is at the upper boundary, but failed with: {result.TopError.Description}");

        // Verify existence in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == result.Value.Id).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.Name.Should().Be(longName);
    }

    [Fact]
    public async Task Handle_WithZeroMinimumPassingMarks_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "Valid Course",
            InstructorId: null,
            MinimumPassingMarks: 0,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.MinimumPassingMarks) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.MinimumPassingMarksMin);
    }

    [Fact]
    public async Task Handle_WithNegativeMinimumPassingMarks_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "Valid Course",
            InstructorId: null,
            MinimumPassingMarks: -1,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.MinimumPassingMarks) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.MinimumPassingMarksMin);
    }

    [Fact]
    public async Task Handle_WithZeroMaximumMarks_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "Valid Course",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 0);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<CreateCourseCommand>(x => x.MaximumMarks) &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.MaximumMarksMin);
    }

    [Fact]
    public async Task Handle_WithMinimumPassingMarksExceedingMaximumMarks_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "Valid Course",
            InstructorId: null,
            MinimumPassingMarks: 80,
            MaximumMarks: 50);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == string.Empty &&
            e.Description == CreateCourseCommandValidator.ErrorMessages.MarksComparisonInvalid);
    }

    [Fact]
    public async Task Handle_WithMinimumPassingMarksEqualToMaximumMarks_ShouldCreateCourseSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new CreateCourseCommand(
            Name: "Perfect Score Course",
            InstructorId: null,
            MinimumPassingMarks: 100,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because equal marks is a valid boundary, but failed with: {result.TopError.Description}");

        // Verify existence in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == result.Value.Id).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.MinimumPassingMarks.Should().Be(100);
        courseInDb.MaximumMarks.Should().Be(100);
    }

    [Fact]
    public async Task Handle_WithNonExistentInstructor_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var nonExistentInstructorId = Guid.NewGuid();
        var command = new CreateCourseCommand(
            Name: "Valid Course",
            InstructorId: nonExistentInstructorId,
            MinimumPassingMarks: 50,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithValidInstructor_ShouldCreateCourseWithInstructor()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create an instructor first
        var instructorEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var instructorPhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createInstructorCommand = new CreateInstructorCommand(
            PersonalInformation: new PersonalInformationDto("Course Instructor", instructorEmail, instructorPhone),
            Password: "SecurePass123!",
            Role: nameof(UserRole.Instructor));
        var instructorResult = await mediator.Send(createInstructorCommand);
        instructorResult.IsSuccess.Should().BeTrue();
        var instructorId = instructorResult.Value.Id;

        // 2. Create course with that instructor
        var command = new CreateCourseCommand(
            Name: "Instructed Course",
            InstructorId: instructorId,
            MinimumPassingMarks: 60,
            MaximumMarks: 100);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsSuccess.Should()
            .BeTrue($"because course with instructor should succeed, but failed with: {result.TopError.Description}");
        result.Value.InstructorId.Should().Be(instructorId);

        // Verify in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == result.Value.Id).FirstOrDefaultAsync();
        courseInDb.Should().NotBeNull();
        courseInDb.InstructorId.Should().Be(instructorId);
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
