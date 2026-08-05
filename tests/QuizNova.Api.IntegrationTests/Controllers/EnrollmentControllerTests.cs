using System.Net;

using FluentAssertions;

using MongoDB.Driver;

using QuizNova.Api.DTOs.Requests;
using QuizNova.Api.IntegrationTests.Common;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Enrollments.DTOs;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Tests.Common.Security;

using Xunit;

namespace QuizNova.Api.IntegrationTests.Controllers;

public class EnrollmentControllerTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task EnrollStudentInCourse_WhenStudent_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");
        var (courseId, _, studentId) = await GetSeededIdsAsync();
        var request = new EnrollStudentInCourseRequest(courseId);

        // Act
        var response = await client.PostAsJsonAsync($"/students/{studentId}/enrollments", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task EnrollStudentInCourse_WhenInstructor_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");
        var (courseId, _, studentId) = await GetSeededIdsAsync();
        var request = new EnrollStudentInCourseRequest(courseId);

        // Act
        var response = await client.PostAsJsonAsync($"/students/{studentId}/enrollments", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task EnrollStudentInCourse_WhenAdmin_ReturnsNoContent()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Admin.User.Email!, TestUsers.Admin.Password, "Admin");

        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var student = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student)
            .SortByDescending(s => s.PersonalInformation.Email).FirstAsync();
        var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

        // Remove student from course first in case they are already enrolled to ensure clean state
        var existingEnrollment = await mongoContext.Enrollments
            .Find(e => e.StudentId == student.Id && e.CourseId == course.Id)
            .FirstOrDefaultAsync();
        if (existingEnrollment is not null)
        {
            await client.DeleteAsync($"/students/{student.Id}/enrollments/{existingEnrollment.Id}");
        }

        var request = new EnrollStudentInCourseRequest(course.Id);

        // Act
        var response = await client.PostAsJsonAsync($"/students/{student.Id}/enrollments", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task RemoveStudentFromCourse_WhenStudent_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");
        var (_, _, studentId) = await GetSeededIdsAsync();

        // Act
        var response = await client.DeleteAsync($"/students/{studentId}/enrollments/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task RemoveStudentFromCourse_WhenInstructor_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");
        var (_, _, studentId) = await GetSeededIdsAsync();

        // Act
        var response = await client.DeleteAsync($"/students/{studentId}/enrollments/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task RemoveStudentFromCourse_WhenAdmin_ReturnsNoContent()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Admin.User.Email!, TestUsers.Admin.Password, "Admin");

        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var student = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student)
            .SortByDescending(s => s.PersonalInformation.Email).FirstAsync();
        var course = await mongoContext.Courses.Find(_ => true).FirstAsync();

        // Ensure enrollment exists
        var request = new EnrollStudentInCourseRequest(course.Id);
        await client.PostAsJsonAsync($"/students/{student.Id}/enrollments", request);

        var enrollment = await mongoContext.Enrollments
            .Find(e => e.StudentId == student.Id && e.CourseId == course.Id)
            .FirstAsync();

        // Act
        var response = await client.DeleteAsync($"/students/{student.Id}/enrollments/{enrollment.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetStudentEnrollmentsCount_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        var studentId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/students/{studentId}/enrollments/count");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetStudentEnrollmentsCount_WithStudentId_ReturnsEnrollmentCountDto()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");
        var (_, _, studentId) = await GetSeededIdsAsync();

        // Act
        var response = await client.GetAsync($"/students/{studentId}/enrollments/count");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var countDto = await response.Content.ReadFromJsonAsync<EnrollmentCountDto>();
        countDto.Should().NotBeNull();
        countDto.EnrollmentsCount.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task GetStudentEnrollments_WithValidId_ReturnsEnrollmentDtos()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");
        var (courseId, _, studentId) = await GetSeededIdsAsync();

        // Enroll first if not enrolled to make sure there's at least 1 enrollment to return
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var studentExistsInCourse =
            await mongoContext.Enrollments.Find(e => e.StudentId == studentId && e.CourseId == courseId).AnyAsync();
        if (!studentExistsInCourse)
        {
            var adminClient = factory.CreateAppHttpClient();
            await adminClient.AuthenticateAsync(TestUsers.Admin.User.Email!, TestUsers.Admin.Password, "Admin");
            var request = new EnrollStudentInCourseRequest(courseId);
            await adminClient.PostAsJsonAsync($"/students/{studentId}/enrollments", request);
        }

        // Act
        var response = await client.GetAsync($"/students/{studentId}/enrollments");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var enrollments = await response.Content.ReadFromJsonAsync<List<EnrollmentDto>>();
        enrollments.Should().NotBeNull();
        enrollments.Count.Should().BeGreaterThan(0);

        var enrollment = enrollments[0];
        enrollment.CourseId.Should().NotBeEmpty();
        enrollment.CourseName.Should().NotBeNullOrEmpty();
        enrollment.Instructor.Should().NotBeNull();
        enrollment.Student.Should().NotBeNull();
        enrollment.Student.StudentId.Should().Be(studentId);
    }

    [Fact]
    public async Task GetStudentEnrollments_WithNonExistentId_ReturnsNotFound()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/students/{nonExistentId}/enrollments");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private async Task<(Guid courseId, Guid instructorId, Guid studentId)> GetSeededIdsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();

        var course = await mongoContext.Courses.Find(_ => true).FirstOrDefaultAsync()
                     ?? throw new InvalidOperationException("No courses found in database.");
        var instructor = await mongoContext.Users.Find(u => u.UserRole == UserRole.Instructor).FirstOrDefaultAsync()
                         ?? throw new InvalidOperationException("No instructors found in database.");
        var student = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student).FirstOrDefaultAsync()
                      ?? throw new InvalidOperationException("No students found in database.");

        return (course.Id, instructor.Id, student.Id);
    }
}
