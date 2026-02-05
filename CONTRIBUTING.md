# Contributing Guidelines

First off, thank you for considering contributing to Practice Tests Exams Platform.

It's people like you that make this project such a great tool.

## Opening an issue:

Thank you for taking the time to open an issue.

Before opening an issue, please be sure that your issue hasn't already been asked by someone.

To begin go to issues tab, select one of the templates and follow the instructions.
<br><br>

When creating issues, keep these key points in mind:

- A descriptive title that gives an idea of what your issue refers to
- A thorough description of the issue, (one word descriptions are very hard to understand)
- Screenshots (if appropriate)
- Links (if appropriate)
  <br><br>

# TLTR: Create a Pull Request

1. Fork this repository.
2. Clone your new repository to your system.
3. Switch to dev branch.
4. Create a new branch from dev (i.e. `feat/[your-branch-name]`).
5. Make necessary changes.
6. Commit changes and push the new branch.
7. Open and submit a PR.

If you have never opened a PR and need direction, read more below.

## Submitting a pull request:

Follow the below mentioned steps to open a pull request(PR):

#### If you don't have git on your machine, [install it](https://help.github.com/articles/set-up-git/).

## Fork this repository

Fork this repository by clicking on the fork button at the top of this page.
This will create a copy of this repository in your account.

## Clone the repository

Now clone the forked repository to your machine. Go to your GitHub account, open the forked repository, click on the code button and then click the _copy to clipboard_ icon.

Open a terminal and run the following git command:

```
git clone https://github.com/Ditectrev/Practice-Exams-Platform.git
```

## Create a branch

Change to the repository directory on your computer (if you are not already there):

```
cd Practice-Exams-Platform
```

Make sure you are on the `dev` branch by running the command :

```
git checkout dev
```

Create and switch to a new branch by running the command:

```
git checkout -b feat/[new-branch-name]
```

For example:

```
git checkout -b feat/add-questions-counter
```

## Make necessary changes and commit those changes

If you go to the project directory and execute the command `git status`, you'll see there are changes.

Add those changes to the branch you just created using the `git add` command:

```
git add "filename with extension in which you have made changes"
```

Now commit those changes using the `git commit` command:

```
git commit -m "Add relevant message to the change you made"
```

## Push changes to GitHub

Push your changes using the command `git push`:

```
git push origin -u feat/[your-branch-name]
```

replacing `[your-branch-name]` with the name of the branch you created earlier.

## Submit your changes for review

If you go to your repository on GitHub, you'll see a `Compare & pull request` button. Click on that button.

Now submit the pull request.

Soon a reviewer will be merging all your changes into the main branch of this project. You will get a notification email once the changes have been merged.
