Feature: Pipe file contents to request body feature

  Scenario: pipe file to body
    Given I pipe contents of file foo.json to body
    When I POST to /post
    Then response body path $.json.foo should be bar
