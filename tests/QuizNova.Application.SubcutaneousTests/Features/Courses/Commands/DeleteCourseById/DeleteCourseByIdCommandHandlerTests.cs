using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Courses.Commands.DeleteCourseById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Courses.Commands.DeleteCourseById;

public class DeleteCourseByIdCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyCourseId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new DeleteCourseByIdCommand(Guid.Empty);

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<DeleteCourseByIdCommand>(x => x.CourseId) &&
            e.Description == DeleteCourseByIdCommandValidator.ErrorMessages.CourseIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentCourseId_ShouldReturnNotFoundError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();
        var command = new DeleteCourseByIdCommand(Guid.NewGuid());

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.CourseNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingCourse_ShouldDeleteSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a course first
        var createResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course To Delete",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        createResult.IsSuccess.Should().BeTrue();
        var courseId = createResult.Value.Id;

        // Act
        var deleteResult = await mediator.Send(new DeleteCourseByIdCommand(courseId));

        // Assert
        deleteResult.IsSuccess.Should().BeTrue();

        // Verify removed from database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        courseInDb.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithAlreadyDeletedCourse_ShouldReturnNotFoundErrorOnSecondDelete()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a course first
        var createResult = await mediator.Send(new CreateCourseCommand(
            Name: "Course Delete Twice",
            InstructorId: null,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        createResult.IsSuccess.Should().BeTrue();
        var courseId = createResult.Value.Id;

        var deleteCommand = new DeleteCourseByIdCommand(courseId);

        // Act
        var deleteResult1 = await mediator.Send(deleteCommand);
        var deleteResult2 = await mediator.Send(deleteCommand);

        // Assert
        deleteResult1.IsSuccess.Should().BeTrue();
        deleteResult2.IsError.Should().BeTrue();
        deleteResult2.TopError.Code.Should().Be(ApplicationErrors.CourseNotFound(Guid.Empty).Code);

        // Verify absent in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var courseInDb = await mongoContext.Courses.Find(c => c.Id == courseId).FirstOrDefaultAsync();
        courseInDb.Should().BeNull();
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
