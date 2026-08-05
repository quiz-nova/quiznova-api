using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Queries.GetCourseById;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Courses;

namespace QuizNova.Application.SubcutaneousTests.Features.Courses.Queries.GetCourseById;

public class GetCourseByIdQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetCourseByIdQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetCourseByIdQuery>(x => x.CourseId) &&
            e.Description == GetCourseByIdQueryValidator.ErrorMessages.CourseIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetCourseByIdQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.CourseNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldReturnCourseDto()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        // 1. Create a Course
        var course = CourseFactory.CreateCourse(name: "GetCourseById Test").Value;

        // 2. Save directly to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Courses.InsertOneAsync(course);

        }

        var query = new GetCourseByIdQuery(course.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Id.Should().Be(course.Id);
        result.Value.CourseName.Should().Be("GetCourseById Test");
    }
}
