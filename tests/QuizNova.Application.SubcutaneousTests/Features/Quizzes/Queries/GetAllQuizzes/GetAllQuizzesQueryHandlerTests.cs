using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Common.Validation;
using QuizNova.Application.Features.Quizzes.Queries.GetAllQuizzes;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Infrastructure.Data.MongoDb;
using QuizNova.Tests.Common.Courses;
using QuizNova.Tests.Common.Quizzes;
using QuizNova.Tests.Common.Users.Instructors;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Queries.GetAllQuizzes;

public class GetAllQuizzesQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // --- Validation tests ---
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Handle_WithPageNumberLessThanOne_ShouldReturnValidationError(int pageNumber)
    {
        var mediator = factory.CreateMediator();
        var query = new GetAllQuizzesQuery(PageNumber: pageNumber);
        var result = await mediator.Send(query);
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllQuizzesQuery>(x => x.PageNumber) &&
            e.Description == ValidationMessages.Pagination.PageNumberMin);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(101)]
    public async Task Handle_WithInvalidPageSize_ShouldReturnValidationError(int pageSize)
    {
        var mediator = factory.CreateMediator();
        var query = new GetAllQuizzesQuery(PageSize: pageSize);
        var result = await mediator.Send(query);
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllQuizzesQuery>(x => x.PageSize) &&
            (e.Description == ValidationMessages.Pagination.PageSizeMin ||
             e.Description == ValidationMessages.Pagination.PageSizeMax(100)));
    }

    [Fact]
    public async Task Handle_WithMarksLessThanZero_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetAllQuizzesQuery(Marks: -1);
        var result = await mediator.Send(query);
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllQuizzesQuery>(x => x.Marks) &&
            e.Description == GetAllQuizzesQueryValidator.ErrorMessages.MarksMin);
    }

    [Fact]
    public async Task Handle_WithSearchTermExceedingLength_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetAllQuizzesQuery(SearchTerm: new string('a', 201));
        var result = await mediator.Send(query);
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetAllQuizzesQuery>(x => x.SearchTerm) &&
            e.Description == ValidationMessages.Pagination.SearchTermMax(200));
    }

    // --- Handler tests ---
    [Fact]
    public async Task Handle_WithDefaultPagination_ShouldReturnPaginatedList()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetAllQuizzesQuery();

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.PageNumber.Should().Be(1);
        result.Value.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task Handle_WithSearchTerm_ShouldFilterCorrectly()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var instructor = InstructorFactory.CreateInstructor().Value;
        var course = CourseFactory.CreateCourse(instructorId: instructor.Id).Value;

        var quiz1 = QuizFactory
            .CreateQuiz(courseId: course.Id, instructorId: instructor.Id, title: "SearchableQuiz Name").Value;
        var quiz2 = QuizFactory.CreateQuiz(courseId: course.Id, instructorId: instructor.Id, title: "OtherQuiz Name")
            .Value;

        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await MongoDbInitializer.InitializeIndexesAsync(mongoContext);
            await mongoContext.Users.InsertOneAsync(instructor);
            await mongoContext.Courses.InsertOneAsync(course);

            await mongoContext.Quizzes.InsertManyAsync([quiz1, quiz2]);
        }

        var query = new GetAllQuizzesQuery(SearchTerm: "SearchableQuiz");

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().ContainSingle(q => q.QuizId == quiz1.Id);
        result.Value.Items.Should().NotContain(q => q.QuizId == quiz2.Id);
    }

    [Fact]
    public async Task Handle_WithMarks_ShouldFilterCorrectly()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var instructor = InstructorFactory.CreateInstructor().Value;
        var course = CourseFactory.CreateCourse(instructorId: instructor.Id).Value;

        var quiz = QuizFactory.CreateQuiz(courseId: course.Id, instructorId: instructor.Id).Value;

        // Total marks for quiz created by QuizFactory is 30 (3 questions * 10 marks)
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(instructor);
            await mongoContext.Courses.InsertOneAsync(course);

            await mongoContext.Quizzes.InsertOneAsync(quiz);
        }

        var queryMatch = new GetAllQuizzesQuery(Marks: 30);
        var queryMismatch = new GetAllQuizzesQuery(Marks: 10);

        // Act
        var resultMatch = await mediator.Send(queryMatch);
        var resultMismatch = await mediator.Send(queryMismatch);

        // Assert
        resultMatch.IsSuccess.Should().BeTrue();
        resultMatch.Value.Items.Any(q => q.QuizId == quiz.Id).Should().BeTrue();

        resultMismatch.IsSuccess.Should().BeTrue();
        resultMismatch.Value.Items.Any(q => q.QuizId == quiz.Id).Should().BeFalse();
    }
}
